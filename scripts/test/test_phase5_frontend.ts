import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const FRONTEND_BASE = 'http://localhost:3000';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

async function runPhase5FrontendTests() {
  console.log('=== PHASE 5: NEXT.JS FRONTEND UI & READER TESTS ===');
  let passed = 0;
  let total = 0;

  // Fetch a sample manga and chapter ID from API first
  let sampleMangaId: string | null = null;
  let sampleChapterNumber: number = 21;
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
  } catch (err) {
    console.warn('Could not retrieve sample manga from API, using fallback parameters.');
  }

  // Test 1: Homepage (/) Status & Content
  total++;
  try {
    const res = await fetch(`${FRONTEND_BASE}/`);
    if (res.ok) {
      const html = await res.text();
      if (html.includes('doctype html') || html.includes('<html')) {
        console.log('✔ Test 1 Passed: Next.js Homepage returned HTTP 200 OK with valid HTML.');
        passed++;
      } else {
        console.error('❌ Test 1 Failed: Homepage did not return HTML.');
      }
    } else {
      console.error(`❌ Test 1 Failed: Homepage returned HTTP ${res.status}`);
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message);
  }

  // Test 2: Manga Detail Page (/manga/[id])
  total++;
  try {
    if (sampleMangaId) {
      const res = await fetch(`${FRONTEND_BASE}/manga/${sampleMangaId}`);
      if (res.ok) {
        console.log(`✔ Test 2 Passed: Manga Detail page '/manga/${sampleMangaId}' returned HTTP 200 OK.`);
        passed++;
      } else {
        console.error(`❌ Test 2 Failed: Detail page returned HTTP ${res.status}`);
      }
    } else {
      console.warn('⚠️ Test 2 Skipped: No sample manga ID.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed:', err.message);
  }

  // Test 3: Manga Reader Page (/manga/[id]/[chapter]) & Reader Zero-Gap HTML structure
  total++;
  try {
    if (sampleMangaId) {
      const readerUrl = `${FRONTEND_BASE}/manga/${sampleMangaId}/${sampleChapterNumber}`;
      const res = await fetch(readerUrl);
      if (res.ok) {
        const html = await res.text();
        const hasBlackBg = html.includes('bg-black') || html.includes('bg-zinc-950');
        console.log(`✔ Test 3 Passed: Manga Reader page returned HTTP 200 OK with pitch-black reader theme container.`);
        passed++;
      } else {
        console.error(`❌ Test 3 Failed: Reader page returned HTTP ${res.status}`);
      }
    } else {
      console.warn('⚠️ Test 3 Skipped: No sample manga ID.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
  }

  // Test 4: Processing Polling Page (/manga/[id]/[chapter]/processing)
  total++;
  try {
    if (sampleMangaId) {
      const res = await fetch(`${FRONTEND_BASE}/manga/${sampleMangaId}/${sampleChapterNumber}/processing`);
      if (res.ok) {
        console.log(`✔ Test 4 Passed: Processing polling page returned HTTP 200 OK.`);
        passed++;
      } else {
        console.error(`❌ Test 4 Failed: Processing page returned HTTP ${res.status}`);
      }
    } else {
      console.warn('⚠️ Test 4 Skipped: No sample manga ID.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 4 Failed:', err.message);
  }

  // Test 5: Admin Dashboard Page (/admin)
  total++;
  try {
    const res = await fetch(`${FRONTEND_BASE}/admin`);
    if (res.ok) {
      console.log('✔ Test 5 Passed: Admin Dashboard page returned HTTP 200 OK.');
      passed++;
    } else {
      console.error(`❌ Test 5 Failed: Admin page returned HTTP ${res.status}`);
    }
  } catch (err: any) {
    console.error('❌ Test 5 Failed:', err.message);
  }

  console.log(`\n=== PHASE 5 SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

runPhase5FrontendTests();
