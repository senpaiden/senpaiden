/**
 * Resilient Supabase Storage -> Backblaze B2 S3 Migration Engine
 * Safely streams slice images in throttled batches, handling socket resets gracefully.
 */

const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

require('dotenv').config();

// Catch any stray socket errors to keep migration running continuously
process.on('uncaughtException', (err) => {
  console.warn('[Recovered Socket Exception]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Recovered Rejection]', reason);
});

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('[Error] SUPABASE_SERVICE_KEY must be set in environment.');
  process.exit(1);
}

global.WebSocket = class Dummy {};
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const B2_BUCKET = process.env.R2_BUCKET_NAME || 'senpaiden-mangas';
const b2 = new S3Client({
  region: process.env.R2_REGION || 'us-east-005',
  endpoint: process.env.R2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
});

let totalMigrated = 0;
let totalSkipped = 0;
let totalErrors = 0;
let totalDeleted = 0;

async function existsInB2(key) {
  try {
    await b2.send(new HeadObjectCommand({ Bucket: B2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function transferChapterFolder(chapterFolder) {
  const folderPath = `manga/${chapterFolder}`;
  try {
    const { data: files, error: listErr } = await supabase.storage
      .from('manga-images')
      .list(folderPath, { limit: 100 });

    if (listErr || !files || files.length === 0) return;

    const deleteKeys = [];

    for (const file of files) {
      if (!file.name || file.name.startsWith('.')) continue;
      const key = `${folderPath}/${file.name}`;

      try {
        const alreadyInB2 = await existsInB2(key);

        if (!alreadyInB2) {
          const { data: blob, error: dlErr } = await supabase.storage
            .from('manga-images')
            .download(key);

          if (dlErr || !blob) {
            totalErrors++;
            continue;
          }

          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          await b2.send(new PutObjectCommand({
            Bucket: B2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          }));

          totalMigrated++;
        } else {
          totalSkipped++;
        }

        deleteKeys.push(key);
      } catch (fileErr) {
        totalErrors++;
      }
    }

    // Clean up from Supabase after successful migration
    if (deleteKeys.length > 0) {
      await supabase.storage.from('manga-images').remove(deleteKeys);
      totalDeleted += deleteKeys.length;
    }

    if (totalMigrated > 0 && totalMigrated % 50 === 0) {
      console.log(`[Progress] Transferred: ${totalMigrated} | Skipped: ${totalSkipped} | Supabase Deleted: ${totalDeleted} | Errors: ${totalErrors}`);
    }
  } catch (folderErr) {
    totalErrors++;
  }
}

async function main() {
  console.log('====================================================');
  console.log('Starting Resilient Supabase Storage -> Backblaze B2 Transfer');
  console.log(`Source: Supabase 'manga-images' -> Target: Backblaze B2 '${B2_BUCKET}'`);
  console.log('====================================================');

  const FOLDER_BATCH = 50;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const { data: folders, error } = await supabase.storage
        .from('manga-images')
        .list('manga', { limit: FOLDER_BATCH, offset, sortBy: { column: 'name', order: 'asc' } });

      if (error) {
        console.error('[Folder List Error]', error.message || error);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (!folders || folders.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`[Batch] Processing ${folders.length} chapter folders (Offset: ${offset})...`);

      // Controlled concurrency: 4 chapters at a time
      const CONCURRENCY = 4;
      for (let i = 0; i < folders.length; i += CONCURRENCY) {
        const chunk = folders.slice(i, i + CONCURRENCY);
        await Promise.all(chunk.map(f => transferChapterFolder(f.name)));
        await new Promise(r => setTimeout(r, 100)); // Smooth socket cooldown
      }

      offset += folders.length;
      console.log(`[Stats] Total Transferred: ${totalMigrated} | Total Deleted from Supabase: ${totalDeleted}`);

      if (folders.length < FOLDER_BATCH) {
        hasMore = false;
      }
    } catch (loopErr) {
      console.error('[Main Loop Error]', loopErr.message || loopErr);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('====================================================');
  console.log('Migration Successfully Finished!');
  console.log(`Total Files Transferred to B2: ${totalMigrated}`);
  console.log(`Total Files Deleted from Supabase: ${totalDeleted}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log('====================================================');
}

main();
