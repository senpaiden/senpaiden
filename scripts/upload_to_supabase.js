require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in environment!');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, '..', 'data', 'mangas');
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

async function supabaseRest(endpoint, method = 'POST', body = null) {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  return res.status === 204 ? [] : await res.json();
}

async function uploadManga(file) {
  const filePath = path.join(DATA_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 1. Insert into public.manga
  const mangaPayload = {
    source_id: data.mangaId || data.slug,
    source_provider: data.sourceProvider || (data.enrichmentStatus === 'requires_mangahook_provider' ? 'mangahook' : 'mangadex'),
    title: data.title,
    cover_url: data.coverUrl || null,
    genres: ['Action', 'Shounen'],
    author: data.author || 'Unknown',
    status: ['ongoing', 'completed', 'hiatus'].includes(data.status) ? data.status : 'ongoing',
    description: (data.description || '').substring(0, 1000)
  };

  const insertedManga = await supabaseRest('manga', 'POST', [mangaPayload]);
  if (!insertedManga || insertedManga.length === 0) {
    throw new Error(`Failed to insert manga ${data.title}`);
  }

  const mangaId = insertedManga[0].id;
  let totalUploadedChapters = 0;
  let totalUploadedPages = 0;

  // 2. Insert chapters
  if (data.chapters && data.chapters.length > 0) {
    // Deduplicate by chapter_number
    const uniqueChaptersMap = new Map();
    for (const ch of data.chapters) {
      const chNum = ch.chapterNumber || 1;
      if (!uniqueChaptersMap.has(chNum)) {
        uniqueChaptersMap.set(chNum, ch);
      }
    }

    const uniqueChapters = Array.from(uniqueChaptersMap.values());

    const chaptersToInsert = uniqueChapters.map(ch => ({
      manga_id: mangaId,
      chapter_number: ch.chapterNumber || 1,
      title: ch.title || `Chapter ${ch.chapterNumber}`,
      source_url: ch.externalUrl || `https://mangadex.org/chapter/${ch.chapterId}`,
      job_status: (ch.pages && ch.pages.length > 0) ? 'READY' : 'QUEUED',
      language: 'en'
    }));

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < chaptersToInsert.length; i += batchSize) {
      const batch = chaptersToInsert.slice(i, i + batchSize);
      const insertedChapters = await supabaseRest('chapters', 'POST', batch);
      totalUploadedChapters += insertedChapters.length;

      // Insert pages for READY chapters
      for (let j = 0; j < batch.length; j++) {
        const origCh = uniqueChapters[i + j];
        const insertedCh = insertedChapters[j];
        if (origCh && origCh.pages && origCh.pages.length > 0 && insertedCh) {
          const pagesPayload = origCh.pages.map((imgUrl, pageIdx) => ({
            chapter_id: insertedCh.id,
            page_number: pageIdx + 1,
            r2_keys: [imgUrl]
          }));

          await supabaseRest('pages', 'POST', pagesPayload);
          totalUploadedPages += pagesPayload.length;
        }
      }
    }
  }

  console.log(`  ✓ [UPLOADED] ${data.title} -> ${totalUploadedChapters} chapters, ${totalUploadedPages} pages`);
}

async function run() {
  console.log(`====================================================`);
  console.log(`UPLOADING ${files.length} LOCAL MANGA CATALOGS TO SUPABASE`);
  console.log(`Target: ${supabaseUrl}`);
  console.log(`====================================================\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    console.log(`[${i + 1}/${files.length}] Uploading ${files[i]}...`);
    try {
      await uploadManga(files[i]);
      successCount++;
    } catch (err) {
      console.error(`  ! [ERROR] Failed to upload ${files[i]}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n====================================================`);
  console.log(`SUPABASE BULK INGESTION COMPLETE`);
  console.log(`====================================================`);
  console.log(`Successfully Uploaded Mangas: ${successCount}`);
  console.log(`Failed Uploads:             ${failCount}`);
}

run();
