const http = require('https');

const DB_BASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

function request(url) {
  return new Promise((resolve, reject) => {
    http.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}

function dbGet(path) {
  return new Promise((resolve, reject) => {
    http.get(DB_BASE_URL + path, {
      headers: { 'apikey': DB_KEY, 'Authorization': 'Bearer ' + DB_KEY }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); }
        catch (e) { resolve(b); }
      });
    }).on('error', reject);
  });
}

function dbPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(DB_BASE_URL + path, {
      method: 'POST',
      headers: {
        'apikey': DB_KEY,
        'Authorization': 'Bearer ' + DB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); }
        catch (e) { resolve(b); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function dbDelete(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(DB_BASE_URL + path, {
      method: 'DELETE',
      headers: { 'apikey': DB_KEY, 'Authorization': 'Bearer ' + DB_KEY }
    }, res => resolve());
    req.on('error', reject);
    req.end();
  });
}

async function scrapeMangaPillChapters(title) {
  const searchHtml = await request(`https://mangapill.com/quick-search?q=${encodeURIComponent(title)}`);
  const match = searchHtml.match(/href="\/manga\/(\d+)\/([^"]+)"/);
  if (!match) return [];

  const urlPath = `/manga/${match[1]}/${match[2]}`;
  const pageHtml = await request(`https://mangapill.com${urlPath}`);
  const matches = [...pageHtml.matchAll(/href="\/chapters\/([^"]+)"/g)];

  const chapters = [];
  matches.forEach(m => {
    const fullSlug = m[1]; // e.g. "4741-10220000/vinland-saga-chapter-220"
    const numMatch = fullSlug.match(/chapter-(\d+(?:\.\d+)?)/i);
    const chNum = numMatch ? parseFloat(numMatch[1]) : null;
    if (chNum !== null) {
      chapters.push({
        chapter_number: chNum,
        source_url: `https://mangapill.com/chapters/${fullSlug}`,
        title: `Chapter ${chNum}`
      });
    }
  });

  chapters.sort((a, b) => a.chapter_number - b.chapter_number);
  return chapters;
}

async function run() {
  const targetTitles = ['Wind Breaker', 'Yu Yu Hakusho', 'Vinland Saga', 'One Punch Man', 'Jujutsu Kaisen', 'Demon Slayer', 'Attack on Titan'];

  for (const title of targetTitles) {
    console.log(`\n==================================================`);
    console.log(`📌 Processing Title: "${title}"`);
    
    const dbManga = await dbGet(`/rest/v1/manga?title=ilike.*${encodeURIComponent(title)}*`);
    if (!dbManga || dbManga.length === 0) {
      console.log(`❌ Manga "${title}" not found in database.`);
      continue;
    }

    const manga = dbManga[0];
    console.log(`  DB Manga ID: ${manga.id}`);

    const chapters = await scrapeMangaPillChapters(title);
    if (chapters.length === 0) {
      console.log(`  ❌ No chapters scraped on MangaPill for "${title}".`);
      continue;
    }

    console.log(`  Scraped ${chapters.length} valid chapters from MangaPill.`);

    // Clear existing chapter stubs (e.g. failed MangaPlus links)
    await dbDelete(`/rest/v1/chapters?manga_id=eq.${manga.id}`);

    const rows = chapters.map(c => ({
      manga_id: manga.id,
      chapter_number: c.chapter_number,
      title: c.title,
      source_url: c.source_url,
      job_status: 'QUEUED',
      language: 'en'
    }));

    // Batch insert
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await dbPost('/rest/v1/chapters', chunk);
    }

    console.log(`  ✅ Successfully seeded ${rows.length} chapters for "${title}" into DB (status = QUEUED)!`);
  }
}

run();
