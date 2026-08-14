const http = require('https');

const DB_BASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(DB_BASE_URL + path);
    const req = http.request(u, {
      method,
      headers: {
        'apikey': DB_KEY,
        'Authorization': 'Bearer ' + DB_KEY,
        'Content-Type': 'application/json',
        ...headers
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(b) }); }
        catch (e) { resolve({ status: res.statusCode, data: b }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== Ingesting Naruto (701 Chapters) from MangaPill into Supabase ===');

  const pillUrl = 'https://mangapill.com/manga/3069/naruto';
  const html = await fetchText(pillUrl);

  const coverMatch = html.match(/src="([^"]+readdetectiveconan[^"]+)"/) || html.match(/<img[^>]*src="([^"]+)"/);
  const coverUrl = coverMatch ? coverMatch[1] : 'https://cdn.readdetectiveconan.com/file/mangap/2/cover.jpg';
  
  const descMatch = html.match(/<p class="text-sm text-secondary my-2">([\s\S]*?)<\/p>/);
  const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : 'Naruto Uzumaki, a hyperactive and knuckle-headed ninja, lives in Konohagakure.';

  const mangaPayload = {
    title: 'Naruto',
    slug: 'naruto',
    cover_url: coverUrl,
    description: description,
    author: 'Masashi Kishimoto',
    artist: 'Masashi Kishimoto',
    status: 'COMPLETED',
    type: 'MANGA',
    genres: ['Action', 'Adventure', 'Fantasy', 'Shounen', 'Martial Arts'],
    updated_at: new Date().toISOString()
  };

  const existingManga = await request('GET', '/rest/v1/manga?title=eq.Naruto&select=id');
  let mangaId;
  if (existingManga.data && existingManga.data.length > 0) {
    mangaId = existingManga.data[0].id;
    console.log(`[DB] Found existing Naruto manga entry ID: ${mangaId}`);
    await request('PATCH', `/rest/v1/manga?id=eq.${mangaId}`, mangaPayload);
  } else {
    const inserted = await request('POST', '/rest/v1/manga', mangaPayload, { 'Prefer': 'return=representation' });
    mangaId = inserted.data[0].id;
    console.log(`[DB] Created new Naruto manga entry ID: ${mangaId}`);
  }

  const linkMatches = [...html.matchAll(/href="(\/chapters\/[^"]+)"/g)];
  console.log(`[MangaPill] Found ${linkMatches.length} chapter links on page.`);

  const seenUrls = new Set();
  const chaptersToInsert = [];
  
  linkMatches.reverse().forEach((match, idx) => {
    const chUrl = 'https://mangapill.com' + match[1];
    if (seenUrls.has(chUrl)) return;
    seenUrls.add(chUrl);

    const chNumMatch = match[1].match(/chapter-([\d.]+)/i);
    const chNum = chNumMatch ? parseFloat(chNumMatch[1]) : (idx + 1);

    chaptersToInsert.push({
      manga_id: mangaId,
      chapter_number: chNum,
      title: `Chapter ${chNum}`,
      source_url: chUrl,
      job_status: 'QUEUED',
      retry_count: 0,
      updated_at: new Date().toISOString()
    });
  });

  console.log(`[DB] Upserting ${chaptersToInsert.length} clean MangaPill chapters in batches of 100...`);
  const chunkSize = 100;
  for (let i = 0; i < chaptersToInsert.length; i += chunkSize) {
    const chunk = chaptersToInsert.slice(i, i + chunkSize);
    const res = await request('POST', '/rest/v1/chapters?on_conflict=manga_id,chapter_number', chunk, {
      'Prefer': 'resolution=merge-duplicates'
    });
    console.log(`[DB] Batch ${Math.floor(i / chunkSize) + 1}/${Math.ceil(chaptersToInsert.length / chunkSize)} upserted (Status: ${res.status}).`);
  }

  console.log(`✅ Successfully imported ${chaptersToInsert.length} Naruto chapters into Supabase!`);
}

run();
