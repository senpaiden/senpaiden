const http = require('https');

const DB_BASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

function request(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch (e) { resolve({ status: res.statusCode, body: b }); }
      });
    }).on('error', reject);
  });
}

async function run() {
  // Test local API or cloudflare worker API
  const WORKER_URL = 'https://senpaiden-api.aakashyaduwanshi0470.workers.dev';
  console.log('Testing Cloudflare Worker API for One Piece Ch 1...');
  
  // Find One Piece ID
  const opRes = await request(`${WORKER_URL}/api/manga?search=one%20piece`);
  console.log('One Piece Search Status:', opRes.status);
  
  if (opRes.body && opRes.body.data && opRes.body.data.length > 0) {
    const mangaId = opRes.body.data[0].id;
    console.log('Manga ID:', mangaId);
    
    const ch1Res = await request(`${WORKER_URL}/api/manga/${mangaId}/chapter/1`);
    console.log('Chapter 1 Status:', ch1Res.status);
    console.log('Chapter 1 Response Keys:', Object.keys(ch1Res.body));
    if (ch1Res.body.pages) {
      console.log(`Pages returned: ${ch1Res.body.pages.length}`);
      console.log('First page sample:', ch1Res.body.pages[0]);
    } else {
      console.log('Body:', ch1Res.body);
    }
  }
}

run();
