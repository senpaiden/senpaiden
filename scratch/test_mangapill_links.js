const http = require('https');

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

async function getMangaPillChapters(title) {
  const searchHtml = await request(`https://mangapill.com/quick-search?q=${encodeURIComponent(title)}`);
  const match = searchHtml.match(/href="\/manga\/(\d+)\/([^"]+)"/);
  if (!match) {
    console.log(`No match for ${title}`);
    return [];
  }
  const urlPath = `/manga/${match[1]}/${match[2]}`;
  console.log(`URL Path for "${title}": ${urlPath}`);
  const html = await request(`https://mangapill.com${urlPath}`);
  const matches = [...html.matchAll(/href="\/chapters\/([^"]+)"/g)];
  return matches.map(m => 'https://mangapill.com/chapters/' + m[1]);
}

async function run() {
  for (const t of ['Wind Breaker', 'Yu Yu Hakusho', 'Vinland Saga', 'One Punch Man', 'Jujutsu Kaisen']) {
    const chs = await getMangaPillChapters(t);
    console.log(`${t}: ${chs.length} chapters found.`);
  }
}

run();
