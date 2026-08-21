import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';
import { MangaPillAdapter } from '../github-action/src/providers/MangaPillAdapter';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: WebSocket } });

async function seedAll10MangaIntoSupabase() {
  console.log('🚀 Seeding all 10 real manga titles into Supabase database...\n');

  try {
    const mangapill = new MangaPillAdapter();
    const mangas = await mangapill.fetchLatestManga(1);

    if (!Array.isArray(mangas) || mangas.length === 0) {
      throw new Error('No manga returned from provider adapter.');
    }

    console.log(`📥 Fetched ${mangas.length} titles from provider API. Upserting into Supabase...`);

    for (const item of mangas) {
      // 1. Upsert Manga Record into Supabase
      const { data: mangaRecord, error: mangaErr } = await supabase
        .from('manga')
        .upsert({
          source_id: item.sourceId,
          source_provider: item.sourceProvider,
          title: item.title,
          cover_url: item.coverUrl,
          author: item.author || 'Popular Author',
          genres: item.genres || ['Action', 'Fantasy'],
          status: item.status || 'ongoing',
          description: item.description || 'Popular Manga Series',
          updated_at: new Date().toISOString()
        }, { onConflict: 'source_id' })
        .select('id, title')
        .single();

      if (mangaErr) {
        console.error(`❌ Error upserting ${item.title}:`, mangaErr.message);
        continue;
      }

      console.log(`  ✓ Upserted Manga: "${mangaRecord.title}" (ID: ${mangaRecord.id})`);

      // 2. Fetch & Upsert Chapters
      try {
        const chapters = await mangapill.fetchChapterList(item.sourceId);
        if (Array.isArray(chapters) && chapters.length > 0) {
          for (const ch of chapters) {
            const { error: chErr } = await supabase
              .from('chapters')
              .upsert({
                manga_id: mangaRecord.id,
                chapter_number: ch.chapterNumber,
                title: ch.title || `Chapter ${ch.chapterNumber}`,
                source_url: `http://localhost:4001/api/chapter/${ch.id}/images`,
                job_status: 'READY',
                content_freshness: 'fresh',
                updated_at: new Date().toISOString()
              }, { onConflict: 'manga_id,chapter_number' });

            if (chErr) console.warn(`    ⚠️ Chapter upsert warning: ${chErr.message}`);
          }
          console.log(`    + Seeded ${chapters.length} chapters for "${mangaRecord.title}"`);
        }
      } catch (err: any) {
        console.warn(`    ⚠️ Skipping chapter list for ${item.title}:`, err.message);
      }
    }

    // Verify DB count
    const { count } = await supabase.from('manga').select('id', { count: 'exact', head: true });
    console.log(`\n🎉 Success! Total manga records in Supabase: ${count}`);

  } catch (err: any) {
    console.error('❌ Seeding failed:', err.message);
  }
}

seedAll10MangaIntoSupabase();
