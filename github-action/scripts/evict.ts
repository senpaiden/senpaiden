// ============================================================
// evict.ts — Weekly image eviction job (Phase 2)
// Calls evict_old_chapter_images() Supabase RPC, then deletes
// corresponding R2 objects using AWS S3-compatible SDK.
// Architecture Decision: AD-004
// ============================================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// ── Clients ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!, // https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? 'manga-images';
const RETENTION_DAYS = parseInt(process.env.IMAGE_RETENTION_DAYS ?? '30', 10);

// ── Delete a single R2 object (with error capture) ───────────────────────────
async function deleteR2Object(key: string): Promise<boolean> {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Eviction] Failed to delete R2 key "${key}": ${msg}`);
    return false;
  }
}

// ── Delete all R2 objects and page records for a list of chapter IDs ─────────
async function purgeChapterImages(chapterIds: string[]): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  for (const chapterId of chapterIds) {
    // 1. Fetch all page records for this chapter
    const { data: pages, error: pagesErr } = await supabase
      .from('pages')
      .select('id, r2_keys')
      .eq('chapter_id', chapterId);

    if (pagesErr) {
      console.error(`[Eviction] Failed to fetch pages for chapter ${chapterId}: ${pagesErr.message}`);
      failed++;
      continue;
    }

    if (!pages || pages.length === 0) {
      console.log(`[Eviction] No pages found for chapter ${chapterId} — skipping R2 delete.`);
      continue;
    }

    // 2. Delete each R2 object key
    for (const page of pages) {
      const keys: string[] = page.r2_keys ?? [];
      for (const key of keys) {
        const ok = await deleteR2Object(key);
        if (ok) {
          deleted++;
          console.log(`[Eviction] Deleted R2 key: ${key}`);
        } else {
          failed++;
        }
      }
    }

    // 3. Delete page records from Supabase (chapter metadata is retained)
    const { error: deleteErr } = await supabase
      .from('pages')
      .delete()
      .eq('chapter_id', chapterId);

    if (deleteErr) {
      console.error(`[Eviction] Failed to delete page records for chapter ${chapterId}: ${deleteErr.message}`);
    } else {
      console.log(`[Eviction] Deleted ${pages.length} page records for chapter ${chapterId}.`);
    }
  }

  return { deleted, failed };
}

// ── Main eviction loop ────────────────────────────────────────────────────────
async function main() {
  console.log(`[Eviction] ── Starting eviction (retention: ${RETENTION_DAYS} days) ──`);

  // Step 1: Call Supabase RPC — marks chapters as ARCHIVED, returns their IDs
  const { data: archivedIds, error: rpcError } = await supabase.rpc('evict_old_chapter_images', {
    days_old: RETENTION_DAYS,
  });

  if (rpcError) {
    console.error('[Eviction] RPC evict_old_chapter_images failed:', rpcError.message);
    process.exit(1);
  }

  const ids: string[] = archivedIds ?? [];
  console.log(`[Eviction] ${ids.length} chapter(s) marked ARCHIVED by Supabase RPC.`);

  if (ids.length === 0) {
    console.log('[Eviction] Nothing to evict. Run complete. ✓');
    return;
  }

  // Step 2: Delete R2 objects and page records
  const { deleted, failed } = await purgeChapterImages(ids);

  console.log('[Eviction] ── Eviction Summary ─────────────────────────────');
  console.log(`[Eviction] R2 objects deleted: ${deleted}`);
  console.log(`[Eviction] R2 deletes failed:  ${failed}`);
  console.log(`[Eviction] Chapters archived:  ${ids.length}`);

  if (failed > 0) {
    console.warn('[Eviction] Some R2 deletions failed. They will be retried on next eviction run.');
  }

  console.log('[Eviction] Run complete. ✓');
}

main().catch((err) => {
  console.error('[Eviction] Fatal unhandled error:', err);
  process.exit(1);
});
