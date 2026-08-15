require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const key = process.env.SUPABASE_SERVICE_KEY;
global.WebSocket = class Dummy {};
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function testLiveChapters() {
  const { data: chapters } = await supabase.from('chapters')
    .select('id, manga_id, chapter_number, job_status')
    .eq('job_status', 'READY')
    .limit(5);

  console.log('=== TESTING 5 LIVE CHAPTERS ===');
  for (const ch of chapters || []) {
    const { data: manga } = await supabase.from('manga').select('id, title').eq('id', ch.manga_id).single();
    const { data: pages } = await supabase.from('pages').select('r2_keys').eq('chapter_id', ch.id).limit(1);
    const firstKey = pages?.[0]?.r2_keys?.[0];

    console.log(`\nTesting Manga: "${manga?.title}" | Chapter ${ch.chapter_number}`);
    console.log(`Key: ${firstKey}`);

    if (firstKey && !firstKey.startsWith('http')) {
      const liveUrl = `https://senpaiden.vercel.app/api/image/${firstKey}`;
      const res = await fetch(liveUrl);
      console.log(`  Live URL: ${liveUrl}`);
      console.log(`  Status: HTTP ${res.status} | Content-Type: ${res.headers.get('content-type')} | Cache: ${res.headers.get('x-vercel-cache')}`);
    } else if (firstKey && firstKey.startsWith('http')) {
      console.log(`  Direct CDN URL: ${firstKey.slice(0, 70)}...`);
    }
  }
}
testLiveChapters();
