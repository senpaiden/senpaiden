const http = require('https');
const fs = require('fs');

const DB_BASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(DB_BASE_URL + path, {
      headers: {
        'apikey': DB_KEY,
        'Authorization': 'Bearer ' + DB_KEY
      }
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

async function fetchAll(path) {
  let all = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const chunk = await request(`${path}&limit=${limit}&offset=${offset}`);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    all.push(...chunk);
    if (chunk.length < limit) break;
    offset += limit;
  }
  return all;
}

async function run() {
  console.log('=== FULL SUPABASE DATABASE MANGA AUDIT (COMPLETE) ===\n');

  const mangas = await request('/rest/v1/manga?select=id,title,status&order=title.asc');
  console.log(`Total Manga Series in Database: ${mangas.length}`);

  const mangaMap = {};
  for (const m of mangas) {
    mangaMap[m.id] = {
      id: m.id,
      title: m.title,
      total: 0,
      ready_completed: 0,
      processing: 0,
      queued: 0,
      failed: 0
    };
  }

  console.log('Fetching all chapter records...');
  const chapters = await fetchAll('/rest/v1/chapters?select=id,manga_id,job_status');
  console.log(`Total Chapter Records across DB: ${chapters.length}\n`);

  let grandReady = 0, grandProc = 0, grandQueued = 0, grandFailed = 0;

  for (const ch of chapters) {
    const m = mangaMap[ch.manga_id];
    if (m) {
      m.total += 1;
      const status = ch.job_status;
      if (status === 'READY' || status === 'COMPLETED') {
        m.ready_completed += 1;
        grandReady++;
      } else if (status === 'PROCESSING') {
        m.processing += 1;
        grandProc++;
      } else if (status === 'QUEUED') {
        m.queued += 1;
        grandQueued++;
      } else if (status === 'FAILED') {
        m.failed += 1;
        grandFailed++;
      }
    }
  }

  const allReports = Object.values(mangaMap);
  fs.writeFileSync('scratch/full_manga_report.json', JSON.stringify(allReports, null, 2));

  const activeSeries = allReports.filter(r => r.total > 0).sort((a, b) => b.total - a.total);

  console.log('============================================');
  console.log(`GRAND DATABASE TOTALS (${chapters.length} Total Chapters):`);
  console.log(`✅ READY / COMPLETED: ${grandReady}`);
  console.log(`⚡ PROCESSING:        ${grandProc}`);
  console.log(`⏳ QUEUED:            ${grandQueued}`);
  console.log(`⚠️  FAILED:            ${grandFailed}`);
  console.log('============================================\n');

  console.log(`📊 ALL MANGA SERIES WITH CHAPTER DATA IN DB (${activeSeries.length} Series):\n`);

  console.table(activeSeries.map(s => ({
    Title: s.title,
    Total: s.total,
    'Ready/Completed': s.ready_completed,
    Processing: s.processing,
    Queued: s.queued,
    Failed: s.failed
  })));
}

run();
