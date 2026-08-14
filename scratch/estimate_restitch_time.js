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
  const mangaId = op[0].id;
  const chapters = await request(`/rest/v1/chapters?manga_id=eq.${mangaId}&job_status=eq.READY&select=id`);
  console.log(`One Piece has ${chapters.length} READY chapters.`);
  
  const chIds = chapters.slice(0, 50).map(c => c.id);
  const pages = await request(`/rest/v1/pages?chapter_id=in.(${chIds.join(',')})&select=id,r2_keys`);
  
  let multiCount = 0;
  pages.forEach(p => {
    if (Array.isArray(p.r2_keys) && p.r2_keys.length > 1) multiCount++;
  });
  
  console.log(`In 50 One Piece chapters (${pages.length} pages total): ${multiCount} pages have multiple slices.`);
}

run();
