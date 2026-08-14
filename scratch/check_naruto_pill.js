const http = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function run() {
  const urls = [
    { title: 'Naruto (Original)', url: 'https://mangapill.com/manga/3069/naruto' },
    { title: 'Naruto (Digital Colored Comics)', url: 'https://mangapill.com/manga/4944/naruto-digital-colored-comics' },
    { title: 'Boruto: Naruto Next Generations', url: 'https://mangapill.com/manga/1336/boruto-naruto-next-generations' },
    { title: 'Boruto: Two Blue Vortex', url: 'https://mangapill.com/manga/5836/boruto-two-blue-vortex' }
  ];

  console.log('=== MangaPill Naruto Series Chapter Counts ===');
  for (const item of urls) {
    const html = await fetchText(item.url);
    const matches = [...html.matchAll(/<a href="\/chapters\/[^"]+"[^>]*>/g)];
    console.log(`[MangaPill] "${item.title}": ${matches.length} English Chapters available (${item.url})`);
  }
}

run();
