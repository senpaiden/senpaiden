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
  console.log('=== CHECKING ONE PIECE IN SUPABASE DB ===');

  const opManga = await request('/rest/v1/manga?title=ilike.*one%20piece*');
  console.log('Manga records for One Piece:', opManga);

  if (opManga && opManga.length > 0) {
    const mangaId = opManga[0].id;
    const chapters = await request(`/rest/v1/chapters?manga_id=eq.${mangaId}&select=id,chapter_number,title,job_status,source_url`);
    console.log(`\nFound ${chapters.length} chapter records for One Piece in DB:`);
    
    const byStatus = {};
    for (const c of chapters) {
      byStatus[c.job_status] = (byStatus[c.job_status] || 0) + 1;
    }
    console.log('Status breakdown:', byStatus);

    if (chapters.length > 0) {
      console.log('Sample chapters:', chapters.slice(0, 5));
    }
  }
}

run();
