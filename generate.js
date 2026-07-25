const fs = require('fs');

async function buildFullServerFile() {
  const item = { key: 'eminence-in-shadow', id: '77bee52c-d2d6-44ad-a33a-1734c1fe696a' };
  const mRes = await fetch('https://api.mangadex.org/manga/' + item.id + '?includes[]=cover_art');
  const json = await mRes.json();
  const mData = json.data;
  const title = mData.attributes.title.en || Object.values(mData.attributes.title)[0];
  const desc = mData.attributes.description.en || 'No description available.';
  const coverObj = mData.relationships.find(r => r.type === 'cover_art');
  const coverFileName = coverObj ? coverObj.attributes.fileName : '';
  const coverUrl = 'https://uploads.mangadex.org/covers/' + item.id + '/' + coverFileName + '.256.jpg';

  const demoManga = [{
    id: item.key,
    title: title,
    thumbnail: coverUrl,
    author: 'Daisuke Aizawa',
    genres: mData.attributes.tags.slice(0, 3).map(t => t.attributes.name.en),
    status: mData.attributes.status,
    description: typeof desc === 'string' ? desc.slice(0, 150) + '...' : 'Popular Manga Series'
  }];

  const feedRes = await fetch('https://api.mangadex.org/manga/' + item.id + '/feed?limit=15');
  const feed = await feedRes.json();
  const chList = [];
  const demoImages = {};

  for (const ch of (feed.data || [])) {
    if (!ch.attributes.chapter) continue;
    const chNum = parseFloat(ch.attributes.chapter);
    if (isNaN(chNum)) continue;
    const chId = item.key + '-' + chNum;
    
    if (!demoImages[chId]) {
      const atHomeRes = await fetch('https://api.mangadex.org/at-home/server/' + ch.id);
      const atHome = await atHomeRes.json();
      if (atHome.chapter && atHome.chapter.data && atHome.chapter.data.length >= 10) {
        chList.push({
          id: chId,
          chapter_number: chNum,
          title: ch.attributes.title || 'Chapter ' + chNum
        });
        demoImages[chId] = atHome.chapter.data.map(f => atHome.baseUrl + '/data/' + atHome.chapter.hash + '/' + f);
        console.log('Ingested', chId, 'with', demoImages[chId].length, 'FULL pages!');
      }
    }
    if (chList.length >= 2) break;
  }

  const demoChapters = { [item.key]: chList };

  const content = `const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const demoManga = ${JSON.stringify(demoManga, null, 2)};
const demoChapters = ${JSON.stringify(demoChapters, null, 2)};
const demoImages = ${JSON.stringify(demoImages, null, 2)};

app.get('/api/manga/latest', (req, res) => {
  if (req.query.page && req.query.page !== "1") return res.json({ mangas: [] });
  res.json({ mangas: demoManga });
});

app.get('/api/manga/:id/chapters', (req, res) => {
  res.json({ chapters: demoChapters[req.params.id] || [] });
});

app.get('/api/chapter/:id/images', (req, res) => {
  res.json({ images: demoImages[req.params.id] || [] });
});

app.listen(PORT, () => console.log('Mock Provider running on port ' + PORT));
`;

  fs.writeFileSync('mock-providers/server.js', content);
  console.log('Successfully wrote full chapters!');
}

buildFullServerFile();
