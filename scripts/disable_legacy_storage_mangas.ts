import ws from 'ws';
(globalThis as any).WebSocket = ws;

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

async function main() {
  console.log('================================================================');
  console.log('  Senpai Den — Disable Legacy Cloudflare & Drive Mangas        ');
  console.log('  (Non-destructive: Marks title_i18n.disabled = true)          ');
  console.log('================================================================\n');

  console.log('📦 Fetching legacy manga titles from Supabase...');
  
  // Fetch non-atsu, non-asura titles
  const { data: legacyMangas, error } = await supabase
    .from('manga')
    .select('id, title, source_provider, source_id, status, title_i18n')
    .not('source_provider', 'in', '("atsu","asura")');

  if (error || !legacyMangas) {
    console.error('Error fetching legacy mangas:', error);
    return;
  }

  console.log(`Found ${legacyMangas.length} legacy titles to disable.\n`);

  let disabledCount = 0;
  for (const m of legacyMangas) {
    const updatedMeta = {
      ...(m.title_i18n || {}),
      disabled: true,
      is_disabled: true,
      disabled_at: new Date().toISOString(),
      reason: 'Migrated to direct CDN streaming'
    };

    const { error: updateErr } = await supabase
      .from('manga')
      .update({
        title_i18n: updatedMeta,
      })
      .eq('id', m.id);

    if (!updateErr) {
      disabledCount++;
      console.log(`[Disabled] [${m.source_provider}] "${m.title}" (${m.id})`);
    } else {
      console.error(`[Error] Failed to disable "${m.title}":`, updateErr.message);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 Successfully disabled ${disabledCount} / ${legacyMangas.length} legacy titles.`);
  console.log(`   (All data preserved safely in Supabase. None were deleted.)`);
  console.log('================================================================\n');
}

main().catch(console.error);
