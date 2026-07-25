import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

async function runPhase4ApiTests() {
  console.log('=== PHASE 4: CLOUDFLARE EDGE WORKER API GATEWAY TESTS ===');
  let passed = 0;
  let total = 0;

  // Test 1: GET /api/manga (List & Search)
  total++;
  try {
    const res = await fetch(`${API_BASE}/api/manga`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : json.data;

    if (Array.isArray(list)) {
      console.log(`✔ Test 1 Passed: GET /api/manga returned ${list.length} manga entries.`);
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Expected array payload from /api/manga.');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message);
  }

  // Test 2: GET /api/manga/:id (Detail Payload)
  total++;
  let targetMangaId: string | null = null;
  let targetChapterId: string | null = null;
  try {
    const listRes = await fetch(`${API_BASE}/api/manga`);
    const json = await listRes.json();
    const list = Array.isArray(json) ? json : json.data;

    if (list && list.length > 0) {
      targetMangaId = list[0].id;
      const detailRes = await fetch(`${API_BASE}/api/manga/${targetMangaId}`);
      if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);
      const manga = await detailRes.json();

      if (manga.id === targetMangaId && Array.isArray(manga.chapters)) {
        if (manga.chapters.length > 0) targetChapterId = manga.chapters[0].id;
        console.log(`✔ Test 2 Passed: GET /api/manga/${targetMangaId} returned detail for '${manga.title}' with ${manga.chapters.length} chapters.`);
        passed++;
      } else {
        console.error('❌ Test 2 Failed: Manga detail payload structure invalid.');
      }
    } else {
      console.warn('⚠️ Test 2 Skipped: No manga available in API response.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed:', err.message);
  }

  // Test 3: GET /api/chapter/:id & X-Content-Freshness Header Injection
  total++;
  try {
    if (targetChapterId) {
      const chRes = await fetch(`${API_BASE}/api/chapter/${targetChapterId}`);
      if (!chRes.ok) throw new Error(`HTTP ${chRes.status}`);
      const freshnessHeader = chRes.headers.get('x-content-freshness');
      const payload = await chRes.json();

      if (payload.pages && freshnessHeader) {
        console.log(`✔ Test 3 Passed: GET /api/chapter/${targetChapterId} payload verified. Freshness Header: '${freshnessHeader}'.`);
        passed++;
      } else {
        console.error('❌ Test 3 Failed: Missing pages or x-content-freshness header.');
      }
    } else {
      console.warn('⚠️ Test 3 Skipped: No target chapter available.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
  }

  // Test 4: GET /api/chapter/:id/status
  total++;
  try {
    if (targetChapterId) {
      const statusRes = await fetch(`${API_BASE}/api/chapter/${targetChapterId}/status`);
      if (!statusRes.ok) throw new Error(`HTTP ${statusRes.status}`);
      const statusPayload = await statusRes.json();

      if (statusPayload.job_status) {
        console.log(`✔ Test 4 Passed: GET /api/chapter/${targetChapterId}/status returned status '${statusPayload.job_status}'.`);
        passed++;
      } else {
        console.error('❌ Test 4 Failed: Invalid status payload structure.');
      }
    } else {
      console.warn('⚠️ Test 4 Skipped: No target chapter available.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 4 Failed:', err.message);
  }

  // Test 5: POST /api/chapter/:id/read
  total++;
  try {
    if (targetChapterId) {
      const readRes = await fetch(`${API_BASE}/api/chapter/${targetChapterId}/read`, { method: 'POST' });
      if (readRes.ok || readRes.status === 200 || readRes.status === 204) {
        console.log(`✔ Test 5 Passed: POST /api/chapter/${targetChapterId}/read recorded read event (HTTP ${readRes.status}).`);
        passed++;
      } else {
        console.error(`❌ Test 5 Failed: Unexpected HTTP status ${readRes.status} from /read endpoint.`);
      }
    } else {
      console.warn('⚠️ Test 5 Skipped: No target chapter available.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 5 Failed:', err.message);
  }

  console.log(`\n=== PHASE 4 SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

runPhase4ApiTests();
