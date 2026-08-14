import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// Helper for paginated Supabase fetches
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

// Fetch aggregate chapter details from MangaDex API
async function fetchMangadexChapters(mangadexId, title) {
  if (!mangadexId) {
    try {
      const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1`);
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data.length > 0) {
        mangadexId = searchData.data[0].id;
      }
    } catch (e) {}
  }

  if (!mangadexId) return { totalOnlineChapters: 0, maxOnlineChapter: 0, chapterList: [] };

  try {
    const res = await fetch(`https://api.mangadex.org/manga/${mangadexId}/aggregate?translatedLanguage[]=en`);
    if (!res.ok) return { mangadexId, totalOnlineChapters: 0, maxOnlineChapter: 0, chapterList: [] };
    const data = await res.json();

    const chapterList = [];
    if (data.volumes) {
      for (const volKey of Object.keys(data.volumes)) {
        const vol = data.volumes[volKey];
        if (vol.chapters) {
          for (const chapKey of Object.keys(vol.chapters)) {
            const c = vol.chapters[chapKey];
            const num = parseFloat(c.chapter);
            if (!isNaN(num)) {
              chapterList.push(num);
            }
          }
        }
      }
    }

    chapterList.sort((a, b) => a - b);
    const uniqueChapters = [...new Set(chapterList)];
    const maxOnlineChapter = uniqueChapters.length > 0 ? Math.max(...uniqueChapters) : 0;

    return {
      mangadexId,
      totalOnlineChapters: uniqueChapters.length,
      maxOnlineChapter,
      chapterList: uniqueChapters
    };
  } catch (e) {
    return { mangadexId, totalOnlineChapters: 0, maxOnlineChapter: 0, chapterList: [] };
  }
}

async function runComparison() {
  console.log('🔄 Fetching local Supabase database records...');
  const mangas = await fetchAllSupabase('manga', 'id,title,source_id,cover_url');
  const chapters = await fetchAllSupabase('chapters', 'id,manga_id,chapter_number,job_status');
  const pages = await fetchAllSupabase('pages', 'id,chapter_id,r2_keys');

  console.log(`Found ${mangas.length} mangas, ${chapters.length} chapters, ${pages.length} pages in Supabase.\n`);

  // Map pages by chapter_id
  const pagesByChapter = new Set(pages.filter(p => p.r2_keys && p.r2_keys.length > 0).map(p => p.chapter_id));

  // Map chapters by manga_id
  const chaptersByManga = {};
  for (const c of chapters) {
    if (!chaptersByManga[c.manga_id]) chaptersByManga[c.manga_id] = [];
    chaptersByManga[c.manga_id].push(c);
  }

  const results = [];
  console.log('🌐 Fetching live MangaDex aggregate data for each manga (with throttling)...');

  for (let i = 0; i < mangas.length; i++) {
    const m = mangas[i];
    const mChaps = chaptersByManga[m.id] || [];
    const localTotalChapters = mChaps.length;

    // Count local chapters that have valid page slices
    const localReadyWithPages = mChaps.filter(c => pagesByChapter.has(c.id)).length;

    const localNums = mChaps.map(c => parseFloat(c.chapter_number)).filter(n => !isNaN(n));
    const maxLocalChapter = localNums.length > 0 ? Math.max(...localNums) : 0;

    // Extract MangaDex ID from source_id or cover_url
    let mangadexId = m.source_id;
    if (!mangadexId && m.cover_url) {
      const match = m.cover_url.match(/\/covers\/([a-f0-9\-]+)\//i);
      if (match) mangadexId = match[1];
    }

    // Throttle requests to avoid rate limits (200ms delay)
    await new Promise(r => setTimeout(r, 200));
    const onlineData = await fetchMangadexChapters(mangadexId, m.title);

    const missingChapters = Math.max(0, onlineData.totalOnlineChapters - localReadyWithPages);

    results.push({
      title: m.title,
      mangadexId: onlineData.mangadexId || mangadexId || 'N/A',
      localTotalChapters,
      localReadyWithPages,
      maxLocalChapter,
      onlineTotalChapters: onlineData.totalOnlineChapters,
      maxOnlineChapter: onlineData.maxOnlineChapter,
      missingChapters,
      status: missingChapters === 0 && onlineData.totalOnlineChapters > 0 ? 'UP TO DATE' : (onlineData.totalOnlineChapters === 0 ? 'NO ONLINE DATA' : `MISSING ${missingChapters}`)
    });

    process.stdout.write(`\rProgress: ${i + 1}/${mangas.length} (${m.title.substring(0, 20)}...)`);
  }

  console.log('\n\n✅ Comparison complete! Generating report...');

  // Sort by missing chapters descending
  results.sort((a, b) => b.missingChapters - a.missingChapters || b.onlineTotalChapters - a.onlineTotalChapters);

  let totalLocalChapters = 0;
  let totalLocalReady = 0;
  let totalOnlineChapters = 0;
  let totalMissing = 0;

  for (const r of results) {
    totalLocalChapters += r.localTotalChapters;
    totalLocalReady += r.localReadyWithPages;
    totalOnlineChapters += r.onlineTotalChapters;
    totalMissing += r.missingChapters;
  }

  console.log(`\n=== OVERALL SUMMARY ===`);
  console.log(`Total Local Chapters Indexed:  ${totalLocalChapters}`);
  console.log(`Total Local Chapters Ready:    ${totalLocalReady}`);
  console.log(`Total Live Online Chapters:    ${totalOnlineChapters}`);
  console.log(`Total Missing Chapters:        ${totalMissing}`);

  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  // Write JSON report
  fs.writeFileSync(path.join(scratchDir, 'manga_chapters_comparison.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { totalLocalChapters, totalLocalReady, totalOnlineChapters, totalMissing },
    results
  }, null, 2));

  // Write Markdown Report
  let md = `# 🌐 Live Internet vs. Local Database Chapter Comparison Report\n\n`;
  md += `**Generated At:** ${new Date().toLocaleString()}\n\n`;
  md += `### 📊 Summary Telemetry\n`;
  md += `| Metric | Count |\n| :--- |\n`;
  md += `| **Total Mangas Evaluated** | **${mangas.length}** |\n`;
  md += `| **Local Chapters Indexed** | **${totalLocalChapters}** |\n`;
  md += `| **Local Chapters Ready (with Slices)** | **${totalLocalReady}** |\n`;
  md += `| **Live Online MangaDex Chapters** | **${totalOnlineChapters}** |\n`;
  md += `| **Total Missing Chapters** | **${totalMissing}** |\n\n`;
  md += `---\n\n`;
  md += `### 📋 Detailed Series Comparison Table\n\n`;
  md += `| # | Manga Title | Local DB (Total / Ready) | Max Local Ch # | Live MangaDex Total | Max MangaDex Ch # | Missing Chs | Sync Status |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  results.forEach((r, idx) => {
    md += `| ${idx + 1} | **${r.title}** | ${r.localTotalChapters} / ${r.localReadyWithPages} | Ch. ${r.maxLocalChapter} | ${r.onlineTotalChapters} | Ch. ${r.maxOnlineChapter} | **${r.missingChapters}** | ${r.status === 'UP TO DATE' ? '✅ UP TO DATE' : (r.status === 'NO ONLINE DATA' ? '❓ NO ONLINE DATA' : '⚠️ ' + r.status)} |\n`;
  });

  const artifactPath = path.join(scratchDir, 'missing_chapters_report.md');
  fs.writeFileSync(artifactPath, md);
  console.log(`\nReport written to ${artifactPath}`);
}

runComparison().catch(console.error);
