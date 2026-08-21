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
  console.log('=== DEBUGGING EMPTY READER FOR READY CHAPTERS ===\n');

  // Fetch One Piece
  const op = await request('/rest/v1/manga?title=ilike.*one%20piece*');
  const opId = op[0].id;

  // Fetch a READY chapter for One Piece
  const chapters = await request(`/rest/v1/chapters?manga_id=eq.${opId}&job_status=eq.READY&limit=5`);
  console.log(`Sample READY chapters for One Piece (${chapters.length} fetched):`);
  for (const c of chapters) {
    console.log(`- Ch.${c.chapter_number} (ID: ${c.id}) | source_url: ${c.source_url}`);
  }

  const sampleCh = chapters[0];
  console.log(`\nChecking pages table for Chapter ID ${sampleCh.id} (Ch ${sampleCh.chapter_number})...`);
  const pages = await request(`/rest/v1/pages?chapter_id=eq.${sampleCh.id}`);
  console.log(`Pages count in DB: ${pages.length}`);
  console.log('Pages data:', JSON.stringify(pages, null, 2));

  // Check another manga like Berserk or Tales of Demons and Gods
  console.log('\nChecking Berserk chapter pages...');
  const berserk = await request('/rest/v1/manga?title=ilike.*berserk*');
  if (berserk.length > 0) {
    const bCh = await request(`/rest/v1/chapters?manga_id=eq.${berserk[0].id}&job_status=eq.READY&limit=1`);
    if (bCh.length > 0) {
      const bPages = await request(`/rest/v1/pages?chapter_id=eq.${bCh[0].id}`);
      console.log(`Berserk Ch ${bCh[0].chapter_number} Pages count in DB: ${bPages.length}`);
      if (bPages.length > 0) {
        console.log('Berserk Sample Page:', bPages[0]);
      }
    }
  }
}

run();
