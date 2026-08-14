const http = require('https');

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

async function run() {
  console.log('=== AUDITING ALL MANGA IN DATABASE ===\n');

  // Fetch all manga
  const allManga = await request('/rest/v1/manga?select=id,title&order=title.asc');
  if (!Array.isArray(allManga)) {
    console.error('Error fetching manga:', allManga);
    return;
  }
  console.log(`Total Manga Series in DB: ${allManga.length}\n`);

  const zeroChapters = [];
  const zeroReadyChapters = [];
  const partiallyReady = [];
  const fullyReady = [];

  for (let i = 0; i < allManga.length; i++) {
    const m = allManga[i];
    const chs = await request(`/rest/v1/chapters?manga_id=eq.${m.id}&select=id,job_status,source_url`);
    if (!Array.isArray(chs) || chs.length === 0) {
      zeroChapters.push(m);
    } else {
      let ready = 0, queued = 0, processing = 0, failed = 0;
      chs.forEach(c => {
        if (c.job_status === 'READY' || c.job_status === 'COMPLETED') ready++;
        else if (c.job_status === 'QUEUED') queued++;
        else if (c.job_status === 'PROCESSING') processing++;
        else if (c.job_status === 'FAILED') failed++;
      });

      const stats = { total: chs.length, ready, queued, processing, failed, sampleSource: chs[0]?.source_url };
      if (ready === 0) {
        zeroReadyChapters.push({ manga: m, stats });
      } else if (ready < chs.length) {
        partiallyReady.push({ manga: m, stats });
      } else {
        fullyReady.push({ manga: m, stats });
      }
    }
  }

  console.log(`--------------------------------------------------`);
  console.log(`SUMMARY AUDIT BREAKDOWN:`);
  console.log(`--------------------------------------------------`);
  console.log(`1. Manga with ZERO CHAPTER RECORDS: ${zeroChapters.length}`);
  console.log(`2. Manga with ZERO READY CHAPTERS (all FAILED/QUEUED): ${zeroReadyChapters.length}`);
  console.log(`3. Manga with PARTIAL READY CHAPTERS: ${partiallyReady.length}`);
  console.log(`4. Manga with 100% READY CHAPTERS: ${fullyReady.length}`);
  console.log(`--------------------------------------------------\n`);

  if (zeroChapters.length > 0) {
    console.log(`❌ CATEGORY 1: MANGA WITH ZERO CHAPTER RECORDS (${zeroChapters.length}):`);
    zeroChapters.forEach(m => console.log(` - [ID: ${m.id}] ${m.title}`));
    console.log('');
  }

  if (zeroReadyChapters.length > 0) {
    console.log(`⚠️ CATEGORY 2: MANGA WITH ZERO READY CHAPTERS (${zeroReadyChapters.length}):`);
    zeroReadyChapters.forEach(item => {
      console.log(` - ${item.manga.title}: Total=${item.stats.total}, Failed=${item.stats.failed}, Queued=${item.stats.queued}, Source=${item.stats.sampleSource}`);
    });
    console.log('');
  }

  // Spot check specific titles
  const targets = ['wind breaker', 'yu yu hakusho', 'vinland saga'];
  console.log(`🎯 SPECIFIC USER TARGETS AUDIT:`);
  allManga.forEach(m => {
    const t = m.title.toLowerCase();
    if (targets.some(target => t.includes(target))) {
      const chStats = zeroReadyChapters.find(x => x.manga.id === m.id) || partiallyReady.find(x => x.manga.id === m.id) || fullyReady.find(x => x.manga.id === m.id);
      console.log(`\n📌 ${m.title}:`);
      console.log(`   ID: ${m.id}`);
      if (chStats) {
        console.log(`   Stats: Total=${chStats.stats.total}, Ready=${chStats.stats.ready}, Failed=${chStats.stats.failed}, Queued=${chStats.stats.queued}`);
      } else {
        console.log(`   Stats: NO CHAPTER RECORDS FOUND!`);
      }
    }
  });
}

run();
