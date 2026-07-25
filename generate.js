const fs = require('fs');

const MANGA_SEARCH_TITLES = [
  "Solo Leveling",
  "One Piece",
  "Jujutsu Kaisen",
  "Chainsaw Man",
  "Spy x Family",
  "My Hero Academia",
  "Attack on Titan",
  "Demon Slayer",
  "Berserk",
  "The Eminence in Shadow"
];

async function generateReal10MangaCatalog() {
  console.log('🚀 Searching & ingesting 10 real manga titles from MangaDex API...');
  
  const demoManga = [];
  const demoChapters = {};
  const demoImages = {};

  for (const titleQuery of MANGA_SEARCH_TITLES) {
    try {
      console.log(`\n🔍 Searching MangaDex for: "${titleQuery}"...`);
      const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(titleQuery)}&limit=1&includes[]=cover_art&includes[]=author`);
      if (!searchRes.ok) continue;

      const searchJson = await searchRes.json();
      if (!searchJson.data || searchJson.data.length === 0) continue;

      const mData = searchJson.data[0];
      const mangaId = mData.id;
      const slugKey = titleQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const title = mData.attributes.title.en || Object.values(mData.attributes.title)[0] || titleQuery;
      const desc = mData.attributes.description.en || 'Popular high-rated manga series.';
      
      const coverObj = mData.relationships.find(r => r.type === 'cover_art');
      const authorObj = mData.relationships.find(r => r.type === 'author');
      
      const coverFileName = coverObj?.attributes?.fileName || '';
      const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}.256.jpg` : '';
      const authorName = authorObj?.attributes?.name || 'Popular Author';
      const genres = (mData.attributes.tags || []).slice(0, 4).map(t => t.attributes.name.en).filter(Boolean);

      demoManga.push({
        id: slugKey,
        title: title,
        thumbnail: coverUrl,
        author: authorName,
        genres: genres.length > 0 ? genres : ['Action', 'Fantasy'],
        status: mData.attributes.status || 'ongoing',
        description: typeof desc === 'string' ? desc.slice(0, 250) + '...' : 'Popular Manga Series'
      });

      console.log(`  ✓ Found: ${title} (${authorName})`);

      // Fetch chapter feed
      const feedRes = await fetch(`https://api.mangadex.org/manga/${mangaId}/feed?limit=25&translatedLanguage[]=en&order[chapter]=asc`);
      const feed = await feedRes.json();
      
      const chList = [];
      for (const ch of (feed.data || [])) {
        if (!ch.attributes.chapter) continue;
        const chNum = parseFloat(ch.attributes.chapter);
        if (isNaN(chNum)) continue;
        const chId = `${slugKey}-${chNum}`;

        if (!demoImages[chId]) {
          try {
            const atHomeRes = await fetch(`https://api.mangadex.org/at-home/server/${ch.id}`);
            if (!atHomeRes.ok) continue;
            const atHome = await atHomeRes.json();

            if (atHome.chapter && atHome.chapter.data && atHome.chapter.data.length >= 5) {
              chList.push({
                id: chId,
                chapter_number: chNum,
                title: ch.attributes.title || `Chapter ${chNum}`
              });

              demoImages[chId] = atHome.chapter.data.map(f => `${atHome.baseUrl}/data/${atHome.chapter.hash}/${f}`);
              console.log(`    + Ingested Chapter ${chNum} (${demoImages[chId].length} pages)`);
            }
          } catch (e) {}
        }

        if (chList.length >= 3) break;
      }

      demoChapters[slugKey] = chList;

    } catch (err) {
      console.error(`❌ Error ingesting "${titleQuery}":`, err);
    }
  }

  console.log(`\n🎉 Ingested ${demoManga.length} real manga titles with ${Object.keys(demoImages).length} chapter image sets!`);

  const serverContent = `const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 4000;

const demoManga = ${JSON.stringify(demoManga, null, 2)};
const demoChapters = ${JSON.stringify(demoChapters, null, 2)};
const demoImages = ${JSON.stringify(demoImages, null, 2)};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (pathname === '/api/manga/latest') {
    const page = parseInt(parsedUrl.query.page || "1", 10);
    if (page > 1) {
      res.end(JSON.stringify({ mangas: [] }));
    } else {
      res.end(JSON.stringify({ mangas: demoManga }));
    }
    return;
  }

  const chapterMatch = pathname.match(/^\\/api\\/manga\\/([^/]+)\\/chapters$/);
  if (chapterMatch) {
    const mangaId = chapterMatch[1];
    res.end(JSON.stringify({ chapters: demoChapters[mangaId] || [] }));
    return;
  }

  const imageMatch = pathname.match(/^\\/api\\/chapter\\/([^/]+)\\/images$/);
  if (imageMatch) {
    const chapterId = imageMatch[1];
    res.end(JSON.stringify({ images: demoImages[chapterId] || [] }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => console.log('Zero-dependency Mock Provider running on port ' + PORT));
`;

  fs.writeFileSync('mock-providers/server.js', serverContent);
  console.log('✅ Successfully updated mock-providers/server.js with zero-dependency HTTP server!');
}

generateReal10MangaCatalog();
