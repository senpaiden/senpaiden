import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log("=== PHASE 3: SPEED & API OPTIMIZATIONS ===\n");

  let passed = 0;
  let total = 2;

  // Test 1: Check compound route in CF Worker
  try {
    const cfWorkerPath = path.resolve(process.cwd(), 'cloudflare-worker/src/index.ts');
    const cfWorkerCode = fs.readFileSync(cfWorkerPath, 'utf-8');
    if (cfWorkerCode.includes('/api/manga/:mangaId/chapter/:chapterNum')) {
      console.log("✔ Test 1 Passed: Compound reader endpoint found in Cloudflare Worker.");
      passed++;
    } else {
      console.error("✖ Test 1 Failed: Compound reader endpoint missing in CF Worker.");
    }
  } catch (e: any) {
    console.error("✖ Test 1 Failed:", e.message);
  }

  // Test 2: Check edge caching
  try {
    const cfWorkerPath = path.resolve(process.cwd(), 'cloudflare-worker/src/index.ts');
    const cfWorkerCode = fs.readFileSync(cfWorkerPath, 'utf-8');
    if (cfWorkerCode.includes('caches.default') && cfWorkerCode.includes('stale-while-revalidate')) {
      console.log("✔ Test 2 Passed: Programmatic caches.default (stale-while-revalidate) found.");
      passed++;
    } else {
      console.error("✖ Test 2 Failed: Edge caching logic missing.");
    }
  } catch (e: any) {
    console.error("✖ Test 2 Failed:", e.message);
  }

  console.log(`\n=== PHASE 3 SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

runTests();
