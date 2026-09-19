import ws from 'ws';
(globalThis as any).WebSocket = ws;

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

async function inspectAll() {
  console.log('Fetching all manga titles...');
  let allMangas: any[] = [];
  let page = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('manga')
      .select('id, title, source_provider, source_id, status, title_i18n')
      .order('id', { ascending: true })
      .range(page * batchSize, (page + 1) * batchSize - 1);

    if (error || !data || data.length === 0) break;
    allMangas.push(...data);
    page++;
  }

  console.log(`Total Manga in Database: ${allMangas.length}`);

  // Group by source_provider
  const providers: Record<string, any[]> = {};
  for (const m of allMangas) {
    const p = m.source_provider || 'unknown';
    if (!providers[p]) providers[p] = [];
    providers[p].push(m);
  }

  console.log('\n--- Manga Counts by Provider ---');
  for (const [p, list] of Object.entries(providers)) {
    console.log(` • ${p.padEnd(15)} : ${list.length} titles`);
  }

  // Check how many pages in 'pages' have 'gdrive/' or R2 keys linked to these mangas
  console.log('\nQuerying chapters and pages for storage references...');
  
  // Sample check pages for mangadex, mangahook, mangapill
  const nonCdnProviders = ['mangahook', 'mangapill', 'mangadex', 'unknown'];
  const legacyTitles = allMangas.filter(m => nonCdnProviders.includes(m.source_provider));
  console.log(`\nTotal Legacy / Cloudflare / Drive Titles to Disable: ${legacyTitles.length}`);
  console.log('Sample titles to disable:');
  legacyTitles.slice(0, 10).forEach(m => console.log(` - [${m.source_provider}] ${m.title} (${m.id})`));
}

inspectAll().catch(console.error);
