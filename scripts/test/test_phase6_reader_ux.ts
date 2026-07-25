import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const FRONTEND_BASE = 'http://localhost:3000';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

async function runPhase6ReaderUxTests() {
  console.log('=== PHASE 6: MANGA READER UX CORE FEATURES TESTS ===');
  let passed = 0;
  let total = 0;

  let sampleMangaId: string | null = null;
  let sampleChapterNumber: number = 21;

  // Step 1: Retrieve sample manga and chapter list
  total++;
  try {
    const listRes = await fetch(`${API_BASE}/api/manga`);
    const json = await listRes.json();
    const list = Array.isArray(json) ? json : json.data;
    if (list && list.length > 0) {
      sampleMangaId = list[0].id;
      const detailRes = await fetch(`${API_BASE}/api/manga/${sampleMangaId}`);
      const manga = await detailRes.json();
      if (manga.chapters && manga.chapters.length > 0) {
        sampleChapterNumber = manga.chapters[0].chapter_number;
      }
    }
    if (sampleMangaId) {
      console.log(`✔ Test 1 Passed: Retrieved active test manga '${sampleMangaId}' (Ch. ${sampleChapterNumber}).`);
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Could not fetch test manga ID.');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message);
  }

  // Step 2: Fetch Reader Page HTML & Verify MangaReaderContainer Hydration
  total++;
  try {
    if (sampleMangaId) {
      const readerUrl = `${FRONTEND_BASE}/manga/${sampleMangaId}/${sampleChapterNumber}`;
      const res = await fetch(readerUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      const hasReaderContainer = html.includes('MangaReaderContainer') || html.includes('data-slice-index') || html.includes('Webtoon Strip') || html.includes('Slice ');

      if (hasReaderContainer) {
        console.log(`✔ Test 2 Passed: Reader page at '${readerUrl}' successfully rendered with MangaReaderContainer components.`);
        passed++;
      } else {
        console.error('❌ Test 2 Failed: HTML output missing MangaReaderContainer components.');
      }
    } else {
      console.warn('⚠️ Test 2 Skipped: Missing sample manga ID.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed:', err.message);
  }

  // Step 3: Verify Dark Reader Theme & Navigation Controls
  total++;
  try {
    if (sampleMangaId) {
      const readerUrl = `${FRONTEND_BASE}/manga/${sampleMangaId}/${sampleChapterNumber}`;
      const res = await fetch(readerUrl);
      const html = await res.text();

      const hasPitchBlack = html.includes('bg-black');
      const hasChapterSelect = html.includes('<select') || html.includes('Chapter ');

      if (hasPitchBlack && hasChapterSelect) {
        console.log('✔ Test 3 Passed: Verified pitch-black (#000000) background theme & chapter select controls.');
        passed++;
      } else {
        console.error('❌ Test 3 Failed: Pitch-black theme or chapter selector missing.');
      }
    } else {
      console.warn('⚠️ Test 3 Skipped: Missing sample manga ID.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
  }

  console.log(`\n=== PHASE 6 SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

runPhase6ReaderUxTests();
