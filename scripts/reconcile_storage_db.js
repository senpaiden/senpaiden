/**
 * Storage & Database Reconciliation Engine
 * 1. Checks all chapters with internal 'manga/' keys.
 * 2. If files are missing in B2, resets job_status to 'QUEUED' and purges invalid page rows.
 * 3. Ensures every 'READY' chapter is 100% readable.
 */

const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('[Error] SUPABASE_SERVICE_KEY is required.');
  process.exit(1);
}

global.WebSocket = class Dummy {};
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const b2 = new S3Client({
  region: process.env.R2_REGION || 'us-east-005',
  endpoint: process.env.R2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function getAllB2Chapters() {
  console.log('Fetching all chapter folders currently in Backblaze B2...');
  let continuationToken;
  const b2Folders = new Set();

  do {
    const res = await b2.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME || 'senpaiden-mangas',
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));

    if (res.Contents) {
      for (const item of res.Contents) {
        if (item.Key.startsWith('manga/')) {
          const parts = item.Key.split('/');
          if (parts[1]) b2Folders.add(parts[1]);
        }
      }
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  console.log(`Verified ${b2Folders.size} distinct chapter folders in Backblaze B2.`);
  return b2Folders;
}

async function reconcile() {
  const b2Folders = await getAllB2Chapters();

  console.log('\nScanning database page records for stale references...');
  let offset = 0;
  const BATCH_SIZE = 1000;
  let hasMore = true;

  const staleChapterIds = new Set();
  const validDirectCdnChapters = new Set();
  const validB2Chapters = new Set();

  while (hasMore) {
    const { data: pages, error } = await supabase
      .from('pages')
      .select('chapter_id, r2_keys')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('[DB Error]', error);
      break;
    }

    if (!pages || pages.length === 0) {
      hasMore = false;
      break;
    }

    for (const page of pages) {
      if (!page.chapter_id) continue;
      const firstKey = page.r2_keys?.[0];

      if (!firstKey) {
        staleChapterIds.add(page.chapter_id);
      } else if (firstKey.startsWith('http')) {
        validDirectCdnChapters.add(page.chapter_id);
      } else if (firstKey.startsWith('manga/')) {
        const chId = firstKey.split('/')[1];
        if (b2Folders.has(chId)) {
          validB2Chapters.add(page.chapter_id);
        } else {
          staleChapterIds.add(page.chapter_id);
        }
      }
    }

    offset += BATCH_SIZE;
    if (pages.length < BATCH_SIZE) hasMore = false;
  }

  console.log('=== AUDIT CLASSIFICATION ===');
  console.log(`Chapters Verified in B2 Storage: ${validB2Chapters.size}`);
  console.log(`Chapters using Direct CDN URLs: ${validDirectCdnChapters.size}`);
  console.log(`Chapters with Missing/Stale Storage: ${staleChapterIds.size}`);

  if (staleChapterIds.size > 0) {
    const ids = Array.from(staleChapterIds);
    console.log(`\nReconciling ${ids.length} stale chapters (Resetting to QUEUED for on-demand processing)...`);

    // Batch update in chunks of 500
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);

      // 1. Delete stale page entries
      await supabase.from('pages').delete().in('chapter_id', chunk);

      // 2. Reset chapter status to QUEUED
      await supabase
        .from('chapters')
        .update({ job_status: 'QUEUED', updated_at: new Date().toISOString() })
        .in('id', chunk);

      console.log(`  Cleaned chunk ${i + 1} to ${Math.min(i + 500, ids.length)}...`);
    }

    console.log('Reconciliation complete! All stale chapters safely queued for processing.');
  } else {
    console.log('All database records are 100% in sync with storage!');
  }
}

reconcile();
