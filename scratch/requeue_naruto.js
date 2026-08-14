const http = require('https');

const DB_BASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(DB_BASE_URL + path);
    const req = http.request(u, {
      method,
      headers: {
        'apikey': DB_KEY,
        'Authorization': 'Bearer ' + DB_KEY,
        'Content-Type': 'application/json'
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); }
        catch (e) { resolve(b); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const naruto = await request('GET', '/rest/v1/manga?title=eq.Naruto&select=id');
  const mangaId = naruto[0].id;
  
  console.log(`Resetting job_status = 'QUEUED' for Naruto (manga ID ${mangaId})...`);
  const res = await request('PATCH', `/rest/v1/chapters?manga_id=eq.${mangaId}&job_status=eq.COMPLETED`, {
    job_status: 'QUEUED',
    retry_count: 0
  });

  console.log('✅ Naruto completed chapters successfully reset to QUEUED for fresh unsliced re-processing!');
}

run();
