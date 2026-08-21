import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function fetchAllSupabase(endpoint, select = '*') {
  let all = [];
  let page = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}?select=${select}&limit=${limit}&offset=${page * limit}`, { headers });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < limit) break;
    page++;
  }
  return all;
}

// Fetch all available English chapters from MangaDex
async function fetchMangaDexFeed(mangadexId) {
  let allChapters = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    try {
      const url = `https://api.mangadex.org/manga/${mangadexId}/feed?translatedLanguage[]=en&limit=${limit}&offset=${offset}&order[chapter]=asc`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      if (!data.data || data.data.length === 0) break;

      allChapters.push(...data.data);
      if (data.data.length < limit) break;
      offset += limit;
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      break;
    }
  }

  return allChapters;
}

async function syncMissing() {
  console.log('🔄 Fetching current Supabase catalog...');
  const mangas = await fetchAllSupabase('manga', 'id,title,source_id,cover_url');
  const chapters = await fetchAllSupabase('chapters', 'id,manga_id,chapter_number');

  console.log(`Found ${mangas.length} mangas and ${chapters.length} existing chapters in Supabase.\n`);

  // Map existing chapters by manga_id -> Set of chapter numbers
  const existingChaptersMap = {};
  for (const c of chapters) {
    if (!existingChaptersMap[c.manga_id]) existingChaptersMap[c.manga_id] = new Set();
    const num = parseFloat(c.chapter_number);
    if (!isNaN(num)) existingChaptersMap[c.manga_id].add(num);
  }

  let totalNewQueued = 0;

  for (let i = 0; i < mangas.length; i++) {
    const m = mangas[i];

    // Skip Martial Peak as explicitly requested by user
    if (m.title.toLowerCase().includes('martial peak') || (m.slug && m.slug.includes('martial-peak'))) {
      console.log(`\n[${i + 1}/${mangas.length}] ⏭️ Skipping "${m.title}" (explicitly excluded).`);
      continue;
    }

    let mangadexId = m.source_id;
    if (!mangadexId && m.cover_url) {
      const match = m.cover_url.match(/\/covers\/([a-f0-9\-]+)\//i);
      if (match) mangadexId = match[1];
    }

    if (!mangadexId) {
      console.log(`\n[${i + 1}/${mangas.length}] ❓ "${m.title}": No MangaDex ID found.`);
      continue;
    }

    process.stdout.write(`\n[${i + 1}/${mangas.length}] 🌐 Checking MangaDex feed for "${m.title}"... `);

    const feedChapters = await fetchMangaDexFeed(mangadexId);
    if (feedChapters.length === 0) {
      console.log(`No English chapters found.`);
      continue;
    }

    const existingSet = existingChaptersMap[m.id] || new Set();
    const toEnqueue = [];

    for (const item of feedChapters) {
      const attr = item.attributes || {};
      const chNum = parseFloat(attr.chapter);
      if (isNaN(chNum)) continue;

      if (!existingSet.has(chNum)) {
        toEnqueue.push({
          manga_id: m.id,
          chapter_number: chNum,
          title: attr.title ? attr.title.substring(0, 255) : `Chapter ${chNum}`,
          source_url: `https://mangadex.org/chapter/${item.id}`,
          job_status: 'QUEUED',
          content_freshness: 'fresh'
        });
        existingSet.add(chNum); // Avoid duplicate entries in loop
      }
    }

    if (toEnqueue.length > 0) {
      console.log(`Found ${toEnqueue.length} missing chapters! Batch inserting to Supabase...`);

      // Upsert in batches of 100
      for (let b = 0; b < toEnqueue.length; b += 100) {
        const batch = toEnqueue.slice(b, b + 100);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/chapters`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'return=minimal, resolution=ignore-duplicates'
          },
          body: JSON.stringify(batch)
        });

        if (!res.ok) {
          console.error(`Error inserting batch:`, res.status, await res.text());
        }
      }

      totalNewQueued += toEnqueue.length;
      console.log(`✅ Successfully queued +${toEnqueue.length} chapters for "${m.title}".`);
    } else {
      console.log(`Already up to date (${existingSet.size} chapters in DB).`);
    }

    // Throttle between mangas
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n==================================================`);
  console.log(`🎉 Missing Chapters Sync Completed!`);
  console.log(`Total New Chapters Enqueued to Queue: ${totalNewQueued}`);
  console.log(`==================================================`);
}

syncMissing().catch(console.error);
