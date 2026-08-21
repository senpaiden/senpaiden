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
  const op = await request('/rest/v1/manga?title=ilike.*one%20piece*');
  console.log('Manga:', op[0].id);
  const ch1 = await request(`/rest/v1/chapters?manga_id=eq.${op[0].id}&chapter_number=eq.1`);
  console.log('Ch 1 chapters count:', ch1.length);
  console.log('Ch 1 details:', ch1);
  if (ch1.length > 0) {
    const pages = await request(`/rest/v1/pages?chapter_id=eq.${ch1[0].id}`);
    console.log('Ch 1 pages count:', pages.length);
  }
}

run();
