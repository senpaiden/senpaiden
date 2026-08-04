const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'mangas');
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Fetch direct page image URLs for a MangaDex chapter
async function fetchMangaDexChapterPages(chapterId) {
  try {
    const res = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
    if (!res.ok) return [];
    const data = await res.json();
    const baseUrl = data.baseUrl;
    const hash = data.chapter?.hash;
    const pageFiles = data.chapter?.data || [];

    if (!baseUrl || !hash || pageFiles.length === 0) return [];

    return pageFiles.map(file => `${baseUrl}/data/${hash}/${file}`);
  } catch (e) {
    return [];
  }
}

async function enrichManga(file) {
  const filePath = path.join(DATA_DIR, file);
  const manga = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!manga.chapters || manga.chapters.length === 0) {
    // Zero chapter gap - marked for MangaHook failover
    manga.enrichmentStatus = 'requires_mangahook_provider';
    fs.writeFileSync(filePath, JSON.stringify(manga, null, 2));
    console.log(`  [GAP] ${manga.title}: 0 chapters on MangaDex (MangaHook required)`);
    return;
  }

  let enrichedCount = 0;
  let hasExternalRedirects = false;

  // Enrich sample of chapters (first 5 for speed & disk space, expandable)
  const chaptersToProcess = manga.chapters.slice(0, 5);

  for (const ch of chaptersToProcess) {
    if (ch.pages && ch.pages.length > 0) continue; // Already enriched

    if (ch.externalUrl) {
      hasExternalRedirects = true;
      ch.pages = []; // External redirect
    } else {
      const pages = await fetchMangaDexChapterPages(ch.chapterId);
      ch.pages = pages;
      if (pages.length > 0) enrichedCount++;
      await sleep(250); // Rate limit
    }
  }

  manga.enrichmentStatus = hasExternalRedirects ? 'external_redirects' : (enrichedCount > 0 ? 'fully_enriched' : 'partial');
  fs.writeFileSync(filePath, JSON.stringify(manga, null, 2));
  console.log(`  [ENRICHED] ${manga.title}: ${enrichedCount} chapter page arrays populated.`);
}

async function run() {
  console.log(`====================================================`);
  console.log(`Enriching ${files.length} Local Manga JSON Files`);
  console.log(`====================================================\n`);

  for (let i = 0; i < files.length; i++) {
    console.log(`[${i + 1}/${files.length}] Processing ${files[i]}...`);
    await enrichManga(files[i]);
  }

  console.log(`\n====================================================`);
  console.log(`Local JSON Enrichment Complete!`);
  console.log(`====================================================`);
}

run();
