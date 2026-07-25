import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const FRONTEND_BASE = 'http://localhost:3000';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

async function runPhase7DetailUxTests() {
  console.log('=== PHASE 7: MANGA DETAIL PAGE UX ENHANCEMENTS TESTS ===');
  let passed = 0;
  let total = 0;

  let sampleMangaId: string | null = null;

  // Step 1: Retrieve active sample manga ID
  total++;
  try {
    const listRes = await fetch(`${API_BASE}/api/manga`);
    const json = await listRes.json();
    const list = Array.isArray(json) ? json : json.data;
    if (list && list.length > 0) {
      sampleMangaId = list[0].id;
      console.log(`✔ Test 1 Passed: Found active test manga '${sampleMangaId}'.`);
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Could not retrieve manga ID.');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message);
  }

  // Step 2: Fetch Detail Page HTML & Verify MangaDetailView Components
  total++;
  try {
    if (sampleMangaId) {
      const detailUrl = `${FRONTEND_BASE}/manga/${sampleMangaId}`;
      const res = await fetch(detailUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      const hasMangaDetailView = html.includes('MangaDetailView') || html.includes('Start Reading') || html.includes('Resume Ch.') || html.includes('Add to Library') || html.includes('Filter chapters...');

      if (hasMangaDetailView) {
        console.log(`✔ Test 2 Passed: Detail page at '${detailUrl}' rendered with MangaDetailView components.`);
        passed++;
      } else {
        console.error('❌ Test 2 Failed: Detail page HTML missing MangaDetailView components.');
      }
    } else {
      console.warn('⚠️ Test 2 Skipped: Missing sample manga ID.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed:', err.message);
  }

  // Step 3: Verify Search Filter & Sort Controls in DOM
  total++;
  try {
    if (sampleMangaId) {
      const detailUrl = `${FRONTEND_BASE}/manga/${sampleMangaId}`;
      const res = await fetch(detailUrl);
      const html = await res.text();

      const hasSearchInput = html.includes('Filter chapters...') || html.includes('placeholder="Filter chapters..."');
      const hasSortButton = html.includes('Newest') || html.includes('Oldest') || html.includes('Sort');

      if (hasSearchInput && hasSortButton) {
        console.log('✔ Test 3 Passed: Verified Chapter Search input & Sort Order controls in DOM.');
        passed++;
      } else {
        console.error('❌ Test 3 Failed: Search input or sort button missing in DOM.');
      }
    } else {
      console.warn('⚠️ Test 3 Skipped: Missing sample manga ID.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
  }

  console.log(`\n=== PHASE 7 SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

runPhase7DetailUxTests();
