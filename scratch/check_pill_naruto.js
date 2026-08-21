const http = require('https');

function getMangaPillChapters(url) {
  return new Promise((resolve) => {
    http.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        const matches = [...b.matchAll(/href="(\/chapters\/[^"]+)"/g)];
        resolve(matches.length);
      });
    }).on('error', () => resolve(0));
  });
}

async function run() {
  const titles = [
    { name: 'Naruto (Original)', url: 'https://mangapill.com/manga/3069/naruto' },
    { name: 'Naruto (Digital Colored Comics)', url: 'https://mangapill.com/manga/4944/naruto-digital-colored-comics' },
    { name: 'Boruto: Naruto Next Generations', url: 'https://mangapill.com/manga/1336/boruto-naruto-next-generations' },
    { name: 'Boruto: Two Blue Vortex', url: 'https://mangapill.com/manga/5836/boruto-two-blue-vortex' }
  ];

  for (const t of titles) {
    const count = await getMangaPillChapters(t.url);
    console.log(`[MangaPill] ${t.name} -> ${count} English Chapters available (${t.url})`);
  }
}

run();
