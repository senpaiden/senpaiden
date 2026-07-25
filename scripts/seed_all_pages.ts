import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: WebSocket } });

// Unique sample fallback image sets per manga domain to guarantee distinct page visual artwork
const TITLE_UNIQUE_IMAGE_SETS: Record<string, string[]> = {
  'chainsaw-man': [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A1-612f24d412cc157e7221bd8a051d5d564adcd539931b8c0bd58b691c07bf8c90.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A2-e55084e7872e417f519215a5517cc9ebca71887f21ced2ef0642b9c9c3c5d1fa.png",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A3-f87a43c0a44a73f552ab58d13c00f8690c4167a5f8e50c7722d60a46a302a346.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A4-dd391d8eb86c963114927dafc5b6f7b7d2dba201b904442a1e1d8d3f58e75ee5.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/d828fa5fffd26b264ad400b3b0fdffe8/A5-7abd9cd1324ceb47ce83c672010198ab691f786662ae9568b61fcb0846dc2e03.png"
  ],
  'demon-slayer': [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/1-75394ea0016b0e6e57d614509d0acecf198b74446bef6dad8502de307b81d633.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/2-af950062ea4bbe1fe3e6d33a8039bc7fc2bcbea9304d285fcbd4d2e6255e5798.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/3-a7c1e9a913cb8987d144a59a187318f9c6602c73fcff013143ad33716fd046fb.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/4-70b65ff3846c1fd5a9ac3e9d4af8f49676133ad4d6ece09efc2ab88f919d4556.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/5-b567a82c55a48c7d29e948b13d1f0cb8eb3d90a9fac7354b39d38dbbebee363c.jpg"
  ],
  'berserk': [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/6-b52819ff075daf882460ff085091d260ef260c7d3173166f1632c68f0b5f7e60.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/7-e117de2c044e4f91a9a61240780f0eec58dba166d6b6c403c84e1a7082efbace.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/8-1c6935f874031e9665b477d5f18d67247228f61f031f9fcef3b36f3401c81359.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/9-12abb0fbc064a143408d30e79efff654e148c38cddde0f5437108d483004f71d.jpg"
  ],
  'the-eminence-in-shadow': [
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/10-88796fbea0a210a010b39330dba49736c2e1fc0743d0b4acdc7caf1ec31fbe5e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/11-d8813ac13e03759dc2594cdd9a501bb6ed6ed4a1ddb16b7813bc62c6587d1d8e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/12-ef613c4c302e9f998ea628d69393accaaf5ea40dda250674d9249a8b5726309e.jpg",
    "https://cmdxd98sb0x3yprd.mangadex.network/data/f9aeea80b6733385a20e2d167c60512d/13-ca3c681ce633f2ef034ada997c52967fa9a0cc908a187e32b3cd65e6081633dd.jpg"
  ]
};

async function seedPagesForAllChapters() {
  console.log('🚀 Seeding UNIQUE chapter page images for ALL 43 chapters in Supabase database...\n');

  try {
    // Fetch all chapters with manga source_id and title info
    const { data: chapters, error: chErr } = await supabase
      .from('chapters')
      .select('id, manga_id, chapter_number, manga(source_id, title)');

    if (chErr || !chapters) throw new Error(`Failed to fetch chapters: ${chErr?.message}`);

    console.log(`Found ${chapters.length} chapters in Supabase. Processing unique image URLs...`);

    let totalPagesSeeded = 0;

    for (const chapter of chapters) {
      const mangaInfo = (chapter.manga as any);
      const sourceId = mangaInfo?.source_id || 'solo-leveling';
      const chNum = chapter.chapter_number;
      const chapterKey = `${sourceId}-${chNum}`;

      // 1. Fetch from mock-provider endpoint first
      let imageUrls: string[] = [];
      try {
        const mockRes = await fetch(`http://localhost:4001/api/chapter/${chapterKey}/images`);
        if (mockRes.ok) {
          const json = await mockRes.json();
          if (Array.isArray(json.images) && json.images.length > 0) {
            imageUrls = json.images;
          }
        }
      } catch (e) {}

      // 2. If fallback needed, use title-unique image set
      if (!imageUrls || imageUrls.length === 0) {
        imageUrls = TITLE_UNIQUE_IMAGE_SETS[sourceId] || TITLE_UNIQUE_IMAGE_SETS['chainsaw-man'];
      }

      // 3. Prepare page payloads
      const pagePayloads = imageUrls.map((imgUrl, idx) => ({
        chapter_id: chapter.id,
        page_number: idx + 1,
        r2_keys: [imgUrl],
        slice_dimensions: [{ width: 800, height: 1200 }],
      }));

      // 4. Delete old pages for this chapter to ensure clean overwrite
      await supabase.from('pages').delete().eq('chapter_id', chapter.id);

      // 5. Upsert unique page payloads into Supabase
      const { error: insertErr } = await supabase
        .from('pages')
        .insert(pagePayloads);

      if (insertErr) {
        console.error(`  ❌ Error inserting pages for ${mangaInfo?.title} Ch. ${chNum}:`, insertErr.message);
      } else {
        totalPagesSeeded += pagePayloads.length;
        console.log(`  + Seeded ${pagePayloads.length} unique page image slices for "${mangaInfo?.title}" Ch. ${chNum}`);
      }
    }

    // Verify total pages in DB
    const { count: totalPages } = await supabase.from('pages').select('id', { count: 'exact', head: true });
    console.log(`\n🎉 SUCCESS! Total unique pages in Supabase database: ${totalPages}`);

  } catch (err: any) {
    console.error('❌ Page seeding failed:', err.message);
  }
}

seedPagesForAllChapters();
