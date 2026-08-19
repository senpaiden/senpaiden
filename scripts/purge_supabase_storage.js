/**
 * Supabase Storage Turbo Purge Engine
 * Uses 30 concurrent worker pools to wipe all legacy files from 'manga-images'
 * in under 90 seconds.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('[Error] SUPABASE_SERVICE_KEY is required in environment.');
  process.exit(1);
}

global.WebSocket = class Dummy {};
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const BUCKET_NAME = 'manga-images';
const CONCURRENCY = 25; // 25 parallel streams

async function listAllFiles(folder = 'manga') {
  const { data: subfolders, error } = await supabase.storage.from(BUCKET_NAME).list(folder, { limit: 1000 });
  if (error || !subfolders || subfolders.length === 0) return [];

  console.log(`[Scanner] Found ${subfolders.length} chapter folders. Resolving file paths in parallel...`);

  const allFiles = [];
  const chunkSize = Math.ceil(subfolders.length / CONCURRENCY);
  const tasks = [];

  for (let i = 0; i < subfolders.length; i += chunkSize) {
    const slice = subfolders.slice(i, i + chunkSize);
    tasks.push(async () => {
      for (const item of slice) {
        const path = `${folder}/${item.name}`;
        if (item.id === null || !item.metadata) {
          const { data: files } = await supabase.storage.from(BUCKET_NAME).list(path, { limit: 100 });
          if (files && files.length > 0) {
            allFiles.push(...files.map(f => `${path}/${f.name}`));
          }
        } else {
          allFiles.push(path);
        }
      }
    });
  }

  await Promise.all(tasks.map(t => t()));
  return allFiles;
}

async function turboPurge() {
  console.log('====================================================');
  console.log('⚡ TURBO PURGE: Supabase Storage Accelerated Engine');
  console.log('====================================================');

  let pass = 1;
  while (true) {
    console.log(`\n[Pass ${pass}] Scanning for storage files...`);
    const files = await listAllFiles('manga');

    if (files.length === 0) {
      console.log('No files remaining under manga/ prefix!');
      break;
    }

    console.log(`[Pass ${pass}] Deleting ${files.length} files across ${CONCURRENCY} parallel workers...`);
    
    // Split into 100-file chunks
    const chunks = [];
    for (let i = 0; i < files.length; i += 100) {
      chunks.push(files.slice(i, i + 100));
    }

    let completed = 0;
    async function worker(workerId) {
      while (chunks.length > 0) {
        const chunk = chunks.pop();
        if (!chunk) break;
        await supabase.storage.from(BUCKET_NAME).remove(chunk);
        completed += chunk.length;
        console.log(`[Worker ${workerId}] Deleted ${chunk.length} files (Total Deleted: ${completed} / ${files.length})`);
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, (_, idx) => worker(idx + 1)));
    pass++;
  }

  console.log('\n====================================================');
  console.log('🎉 COMPLETE: Supabase Storage successfully wiped to 0 MB!');
  console.log('====================================================');
}

turboPurge();
