const http = require('https');

const DB_BASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

function patch(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(DB_BASE_URL + path, {
      method: 'PATCH',
      headers: {
        'apikey': DB_KEY,
        'Authorization': 'Bearer ' + DB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
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
    req.write(data);
    req.end();
  });
}

function get(path) {
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
  const op = await get('/rest/v1/manga?title=ilike.*one%20piece*');
  const mangaId = op[0].id;
  
  console.log('Fixing One Piece Chapters 1, 2, 3 source URLs...');
  
  const ch1 = await patch(`/rest/v1/chapters?manga_id=eq.${mangaId}&chapter_number=eq.1`, {
    source_url: 'https://mangapill.com/chapters/2-10001000/one-piece-chapter-1',
    job_status: 'QUEUED',
    error_message: null
  });
  
  const ch2 = await patch(`/rest/v1/chapters?manga_id=eq.${mangaId}&chapter_number=eq.2`, {
    source_url: 'https://mangapill.com/chapters/2-10002000/one-piece-chapter-2',
    job_status: 'QUEUED',
    error_message: null
  });
  
  const ch3 = await patch(`/rest/v1/chapters?manga_id=eq.${mangaId}&chapter_number=eq.3`, {
    source_url: 'https://mangapill.com/chapters/2-10003000/one-piece-chapter-3',
    job_status: 'QUEUED',
    error_message: null
  });

  console.log('Updated Ch 1:', ch1);
  console.log('Updated Ch 2:', ch2);
  console.log('Updated Ch 3:', ch3);
}

run();
