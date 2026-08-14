const http = require('https');

const DB_BASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

function request(url) {
  return new Promise((resolve, reject) => {
    http.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
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

function dbPatch(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(DB_BASE_URL + path, {
      method: 'PATCH',
      headers: {
        'apikey': DB_KEY,
        'Authorization': 'Bearer ' + DB_KEY,
        'Content-Type': 'application/json'
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function scrapeMangaPillChapters(searchQuery) {
  try {
    const searchHtml = await request(`https://mangapill.com/quick-search?q=${encodeURIComponent(searchQuery)}`);
    const match = searchHtml.match(/href="\/manga\/(\d+)\/([^"]+)"/);
    if (!match) return null;
    
    const mangaSlug = `${match[1]}-${match[2]}`;
    console.log(`Found MangaPill slug for "${searchQuery}": ${mangaSlug}`);
    
    const pageHtml = await request(`https://mangapill.com/manga/${mangaSlug}`);
    const chapterMatches = [...pageHtml.matchAll(/href="\/chapters\/(\d+-\d+)\/([^"]+)"/g)];
    
    const chapters = [];
    chapterMatches.forEach(m => {
      const chPath = m[1];
      const chSlug = m[2];
      const numMatch = chSlug.match(/chapter-(\d+(?:\.\d+)?)/i);
      const chNum = numMatch ? parseFloat(numMatch[1]) : null;
      if (chNum !== null) {
        chapters.push({
          chapter_number: chNum,
          source_url: `https://mangapill.com/chapters/${chPath}/${chSlug}`,
          title: `Chapter ${chNum}`
        });
      }
    });
    
    // Sort ascending
    chapters.sort((a, b) => a.chapter_number - b.chapter_number);
    return chapters;
  } catch (e) {
    console.error(`Error scraping MangaPill for "${searchQuery}":`, e.message);
    return null;
  }
}

async function run() {
  const targetTitles = ['Wind Breaker', 'Yu Yu Hakusho', 'Vinland Saga'];
  console.log(`=== SYNCING CHAPTERS FOR USER TARGET TITLES ===\n`);

  for (const title of targetTitles) {
    console.log(`🔍 Searching chapters for: ${title}`);
    
    // Get manga ID from DB
    const dbRes = await new Promise((resolve) => {
      http.get(DB_BASE_URL + `/rest/v1/manga?title=ilike.*${encodeURIComponent(title)}*`, {
        headers: { 'apikey': DB_KEY, 'Authorization': 'Bearer ' + DB_KEY }
      }, res => {
        let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b)));
      });
    });

    if (!dbRes || dbRes.length === 0) {
      console.log(`❌ Manga "${title}" not found in DB.`);
      continue;
    }
    
    const manga = dbRes[0];
    console.log(`  Found DB Manga ID: ${manga.id}`);

    const chapters = await scrapeMangaPillChapters(title);
    if (!chapters || chapters.length === 0) {
      console.log(`  ❌ No chapters found on MangaPill for "${title}".`);
      continue;
    }

    console.log(`  Found ${chapters.length} chapters on MangaPill! Seeding into DB...`);

    // Delete any old failed chapter stubs
    await new Promise(resolve => {
      const req = http.request(DB_BASE_URL + `/rest/v1/chapters?manga_id=eq.${manga.id}`, {
        method: 'DELETE',
        headers: { 'apikey': DB_KEY, 'Authorization': 'Bearer ' + DB_KEY }
      }, res => resolve());
      req.end();
    });

    // Prepare batch rows
    const rows = chapters.map(c => ({
      manga_id: manga.id,
      chapter_number: c.chapter_number,
      title: c.title,
      source_url: c.source_url,
      job_status: 'QUEUED',
      language: 'en'
    }));

    // Insert in batches of 100
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await dbPost('/rest/v1/chapters', chunk);
    }

    console.log(`  ✅ Successfully seeded ${rows.length} chapters for "${title}" into DB with status = QUEUED!\n`);
  }
}

run();
