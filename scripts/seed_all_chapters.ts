import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: WebSocket } });

const MANGA_CHAPTER_MAPPINGS: Record<string, number[]> = {
  'solo-leveling': [1, 2, 3, 4, 5],
  'one-piece': [1000, 1001, 1002, 1003],
  'jujutsu-kaisen': [1, 2, 3, 4],
  'chainsaw-man': [1, 2, 3, 4],
  'spy-x-family': [1, 2, 3, 4],
  'my-hero-academia': [1, 2, 3, 4],
  'attack-on-titan': [1, 2, 3, 4],
  'demon-slayer': [1, 2, 3, 4],
  'berserk': [1, 2, 3, 4],
  'the-eminence-in-shadow': [1, 2, 3, 4],
  'eminence-in-shadow': [21, 43]
};

async function seedChaptersForAllManga() {
  console.log('🚀 Ensuring ALL 11 manga titles have active chapters in Supabase database...\n');

  try {
    const { data: mangas, error: mErr } = await supabase.from('manga').select('id, title, source_id');
    if (mErr || !mangas) throw new Error('Failed to fetch manga list from Supabase');

    let totalChaptersInserted = 0;

    for (const manga of mangas) {
      const sourceId = manga.source_id || 'solo-leveling';
      const chapterNums = MANGA_CHAPTER_MAPPINGS[sourceId] || [1, 2, 3];

      for (const chNum of chapterNums) {
        const chId = `${sourceId}-${chNum}`;
        const sourceUrl = `http://localhost:4001/api/chapter/${chId}/images`;

        const { error: chErr } = await supabase
          .from('chapters')
          .upsert({
            manga_id: manga.id,
            chapter_number: chNum,
            title: `Chapter ${chNum}`,
            source_url: sourceUrl,
            job_status: 'READY',
            content_freshness: 'fresh',
            updated_at: new Date().toISOString()
          }, { onConflict: 'manga_id,chapter_number' });

        if (chErr) {
          console.warn(`    ⚠️ Chapter ${chNum} for ${manga.title} error:`, chErr.message);
        } else {
          totalChaptersInserted++;
        }
      }
      console.log(`  ✓ Seeded chapters for "${manga.title}" (${chapterNums.join(', ')})`);
    }

    // Verify DB count
    const { count: chCount } = await supabase.from('chapters').select('id', { count: 'exact', head: true });
    console.log(`\n🎉 Success! Total chapters in Supabase: ${chCount}`);

  } catch (err: any) {
    console.error('❌ Seeding chapters failed:', err.message);
  }
}

seedChaptersForAllManga();
