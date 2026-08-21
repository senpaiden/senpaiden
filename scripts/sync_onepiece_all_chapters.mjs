import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function syncOnePiece() {
  console.log('🔄 Fetching One Piece manga record from Supabase...');
  const resManga = await fetch(`${SUPABASE_URL}/rest/v1/manga?title=ilike.*One%20Piece*&select=id,title`, { headers });
  const mangas = await resManga.json();

  if (!mangas || mangas.length === 0) {
    console.error('One Piece manga not found in database!');
    return;
  }

  const onePiece = mangas.find(m => m.title.toLowerCase() === 'one piece') || mangas[0];
  console.log(`Found One Piece ID: ${onePiece.id} ("${onePiece.title}")`);

  console.log('🌐 Fetching full 1,206 chapter index from MangaPill...');
  const mpRes = await fetch('https://mangapill.com/manga/2/one-piece', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const html = await mpRes.text();
  const matches = [...html.matchAll(/\/chapters\/(2-[\d]+)\/one-piece-chapter-([\d.]+)/g)];

  console.log(`Extracted ${matches.length} English chapters from MangaPill.`);

  if (matches.length === 0) {
    console.error('Failed to extract chapters from MangaPill HTML');
    return;
  }

  // Fetch existing chapters in Supabase for One Piece
  const resChaps = await fetch(`${SUPABASE_URL}/rest/v1/chapters?manga_id=eq.${onePiece.id}&select=chapter_number`, { headers });
  const existingChaps = await resChaps.json();
  const existingNums = new Set(existingChaps.map(c => parseFloat(c.chapter_number)));

  const toInsert = [];
  for (const m of matches) {
    const relUrl = m[0];
    const chNum = parseFloat(m[2]);

    if (!isNaN(chNum) && !existingNums.has(chNum)) {
      toInsert.push({
        manga_id: onePiece.id,
        chapter_number: chNum,
        title: `Chapter ${chNum}`,
        source_url: `https://mangapill.com${relUrl}`,
        job_status: 'QUEUED',
        content_freshness: 'fresh'
      });
      existingNums.add(chNum);
    }
  }

  console.log(`Found ${toInsert.length} NEW chapters to add for One Piece!`);

  if (toInsert.length > 0) {
    // Sort ascending chapter order
    toInsert.sort((a, b) => a.chapter_number - b.chapter_number);

    for (let b = 0; b < toInsert.length; b += 100) {
      const batch = toInsert.slice(b, b + 100);
      const postRes = await fetch(`${SUPABASE_URL}/rest/v1/chapters`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=minimal, resolution=ignore-duplicates'
        },
        body: JSON.stringify(batch)
      });

      if (!postRes.ok) {
        console.error(`Batch error:`, postRes.status, await postRes.text());
      }
    }

    console.log(`✅ Successfully queued all ${toInsert.length} English chapters of One Piece!`);
  } else {
    console.log(`One Piece is already fully up to date in Supabase!`);
  }
}

syncOnePiece().catch(console.error);
