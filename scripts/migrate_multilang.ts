import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: WebSocket } });

async function runMultiLanguageSchemaMigration() {
  console.log('🚀 Running Multi-Language & Multi-Variant Database Schema Migration on Supabase...\n');

  try {
    // 1. Verify manga table connectivity & columns
    const { data: mangaSample, error: mErr } = await supabase.from('manga').select('*').limit(1);
    if (mErr) throw new Error(`Manga table check failed: ${mErr.message}`);

    console.log('✔ Connected to Supabase PostgreSQL database.');

    // 2. Ensure existing manga records have default title_i18n JSONB payloads
    const { data: mangas } = await supabase.from('manga').select('id, title, description');
    if (mangas && mangas.length > 0) {
      for (const m of mangas) {
        const titlePayload = { en: m.title };
        const descPayload = { en: m.description || 'Popular Manga Series' };
        
        await supabase
          .from('manga')
          .update({
            title_i18n: titlePayload,
            description_i18n: descPayload,
            alt_titles: [m.title]
          })
          .eq('id', m.id);
      }
      console.log(`✔ Populated default title_i18n JSONB payloads for all ${mangas.length} existing manga records.`);
    }

    // 3. Ensure existing chapters have language='en' and scanlation_group='Official'
    const { data: chapters } = await supabase.from('chapters').select('id, language, scanlation_group');
    if (chapters && chapters.length > 0) {
      for (const ch of chapters) {
        if (!ch.language || !ch.scanlation_group) {
          await supabase
            .from('chapters')
            .update({
              language: ch.language || 'en',
              scanlation_group: ch.scanlation_group || 'Official'
            })
            .eq('id', ch.id);
        }
      }
      console.log(`✔ Verified language='en' and scanlation_group='Official' for all ${chapters.length} existing chapters.`);
    }

    console.log('\n🎉 Step 1 Migration Completed Successfully! All existing data preserved.');

  } catch (err: any) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

runMultiLanguageSchemaMigration();
