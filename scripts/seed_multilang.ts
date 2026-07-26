import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: WebSocket } });

async function seedMultiLanguageVariants() {
  console.log('🚀 Ingesting & Seeding Multi-Language Chapter Variants (English, Spanish, French) into Supabase...\n');

  try {
    const { data: mangas } = await supabase.from('manga').select('id, title, source_id');
    if (!mangas || mangas.length === 0) throw new Error('No manga found in DB.');

    // Ingest Spanish (es) & French (fr) variants for key titles
    const targetManga = mangas.find(m => m.source_id === 'chainsaw-man') || mangas[0];

    console.log(`Seeding multi-language chapter variants for "${targetManga.title}"...`);

    // Add Spanish (es) Chapter 1 variant by Scanlation Group "MangaLatino"
    const { data: esCh, error: esErr } = await supabase
      .from('chapters')
      .upsert({
        manga_id: targetManga.id,
        chapter_number: 1,
        title: 'Un Perro y una Motosierra (Spanish Scan)',
        language: 'es',
        scanlation_group: 'MangaLatino',
        source_url: 'http://localhost:4001/api/chapter/chainsaw-man-1-es/images',
        job_status: 'READY',
        content_freshness: 'fresh',
        updated_at: new Date().toISOString()
      }, { onConflict: 'manga_id,chapter_number,language,scanlation_group' })
      .select()
      .single();

    if (esErr) console.warn('⚠️ Spanish Chapter 1 upsert notice:', esErr.message);

    // Add French (fr) Chapter 1 variant by Scanlation Group "ScanFr"
    const { data: frCh, error: frErr } = await supabase
      .from('chapters')
      .upsert({
        manga_id: targetManga.id,
        chapter_number: 1,
        title: 'Le Chien et la Tronçonneuse (French Scan)',
        language: 'fr',
        scanlation_group: 'ScanFr',
        source_url: 'http://localhost:4001/api/chapter/chainsaw-man-1-fr/images',
        job_status: 'READY',
        content_freshness: 'fresh',
        updated_at: new Date().toISOString()
      }, { onConflict: 'manga_id,chapter_number,language,scanlation_group' })
      .select()
      .single();

    if (frErr) console.warn('⚠️ French Chapter 1 upsert notice:', frErr.message);

    // Add English Scanlation Group 2 variant for Chapter 1 by "FlameScans"
    const { data: enGroup2, error: enGroupErr } = await supabase
      .from('chapters')
      .upsert({
        manga_id: targetManga.id,
        chapter_number: 1,
        title: 'A Dog and a Chainsaw (HQ FlameScans Release)',
        language: 'en',
        scanlation_group: 'FlameScans',
        source_url: 'http://localhost:4001/api/chapter/chainsaw-man-1-flame/images',
        job_status: 'READY',
        content_freshness: 'fresh',
        updated_at: new Date().toISOString()
      }, { onConflict: 'manga_id,chapter_number,language,scanlation_group' })
      .select()
      .single();

    if (enGroupErr) console.warn('⚠️ English Group 2 Chapter 1 upsert notice:', enGroupErr.message);

    // Seed page image slices for the new multi-language chapter variants
    if (esCh) {
      const pagePayloads = Array.from({ length: 15 }).map((_, idx) => ({
        chapter_id: esCh.id,
        page_number: idx + 1,
        r2_keys: [`https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A${idx + 1}-sample-es.jpg`],
        slice_dimensions: [{ width: 800, height: 1200 }]
      }));
      await supabase.from('pages').upsert(pagePayloads, { onConflict: 'chapter_id,page_number' });
      console.log(`  + Seeded Spanish (es) page slices for Ch. 1`);
    }

    if (frCh) {
      const pagePayloads = Array.from({ length: 15 }).map((_, idx) => ({
        chapter_id: frCh.id,
        page_number: idx + 1,
        r2_keys: [`https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A${idx + 1}-sample-fr.jpg`],
        slice_dimensions: [{ width: 800, height: 1200 }]
      }));
      await supabase.from('pages').upsert(pagePayloads, { onConflict: 'chapter_id,page_number' });
      console.log(`  + Seeded French (fr) page slices for Ch. 1`);
    }

    if (enGroup2) {
      const pagePayloads = Array.from({ length: 15 }).map((_, idx) => ({
        chapter_id: enGroup2.id,
        page_number: idx + 1,
        r2_keys: [`https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A${idx + 1}-sample-flame.jpg`],
        slice_dimensions: [{ width: 800, height: 1200 }]
      }));
      await supabase.from('pages').upsert(pagePayloads, { onConflict: 'chapter_id,page_number' });
      console.log(`  + Seeded English (en) FlameScans page slices for Ch. 1`);
    }

    console.log('\n🎉 Step 2 Multi-Language & Multi-Group Ingestion Completed Successfully!');

  } catch (err: any) {
    console.error('❌ Multi-language seeding error:', err.message);
  }
}

seedMultiLanguageVariants();
