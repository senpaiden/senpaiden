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
  console.log('=== INSPECTING ONE PIECE CHAPTER 7 DB RECORDS ===');

  const op = await request('/rest/v1/manga?title=ilike.*one%20piece*');
  const mangaId = op[0].id;

  const ch7 = await request(`/rest/v1/chapters?manga_id=eq.${mangaId}&chapter_number=eq.7`);
  console.log('Chapter 7 metadata:', ch7);

  if (ch7 && ch7.length > 0) {
    const chId = ch7[0].id;
    const pages = await request(`/rest/v1/pages?chapter_id=eq.${chId}&order=page_number.asc`);
    console.log(`Chapter 7 has ${pages.length} pages in DB.`);
    console.log('First 5 pages data:');
    pages.slice(0, 5).forEach(p => {
      console.log(`Page ${p.page_number}: r2_keys=${JSON.stringify(p.r2_keys)}, slice_dimensions=${p.slice_dimensions}`);
    });
  }
}

run();
