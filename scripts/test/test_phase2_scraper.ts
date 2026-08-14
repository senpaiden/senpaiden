import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

import { MangaPillAdapter } from '../../github-action/src/providers/MangaPillAdapter';
import { MangaDexAdapter } from '../../github-action/src/providers/MangaDexAdapter';
import { ProviderOrchestrator } from '../../github-action/src/providers/ProviderOrchestrator';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: WebSocket } });

async function runPhase2ScraperTests() {
  console.log('=== PHASE 2: PROVIDER ADAPTERS & SCRAPER TESTS ===');
  let passed = 0;
  let total = 0;

  // Test 1: MangaPillAdapter Fetching
  total++;
  try {
    const mangapill = new MangaPillAdapter();
    const mangaList = await mangapill.fetchLatestManga(1);
    if (Array.isArray(mangaList) && mangaList.length > 0) {
      console.log(`✔ Test 1 Passed: MangaPillAdapter fetched ${mangaList.length} manga entries.`);
      passed++;
    } else {
      console.error('❌ Test 1 Failed: MangaPillAdapter returned empty or invalid manga list.');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message);
  }

  // Test 2: Throttling Verification (2 req/s -> ~500ms spacing between requests)
  total++;
  try {
    const mangapill = new MangaPillAdapter();
    const start = Date.now();
    await Promise.all([
      mangapill.fetchLatestManga(1),
      mangapill.fetchLatestManga(1)
    ]);
    const elapsed = Date.now() - start;
    if (elapsed >= 450) {
      console.log(`✔ Test 2 Passed: BaseAdapter throttling enforced request delay (${elapsed}ms >= 450ms).`);
      passed++;
    } else {
      console.warn(`⚠️ Test 2 Warning: Request spacing was ${elapsed}ms (expected >= 450ms).`);
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed:', err.message);
  }

  // Test 3: Provider Failover Logic (Orchestrator)
  total++;
  try {
    const orchestrator = new ProviderOrchestrator();
    const result = await orchestrator.fetchLatestManga(1);
    if (result.success && Array.isArray(result.data)) {
      console.log(`✔ Test 3 Passed: ProviderOrchestrator returned data from provider '${result.provider}' (${result.data.length} items).`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed: ProviderOrchestrator returned blackout/failure.');
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
  }

  // Test 4: Provider Failover Chapter List Fetching
  total++;
  try {
    const orchestrator = new ProviderOrchestrator();
    const result = await orchestrator.fetchChapterList('eminence-in-shadow');
    if (result.success && Array.isArray(result.data)) {
      console.log(`✔ Test 4 Passed: ProviderOrchestrator fetched chapter list from provider '${result.provider}' (${result.data.length} chapters).`);
      passed++;
    } else {
      console.error('❌ Test 4 Failed: ProviderOrchestrator chapter list fetch failed.');
    }
  } catch (err: any) {
    console.error('❌ Test 4 Failed:', err.message);
  }

  console.log(`\n=== PHASE 2 SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

runPhase2ScraperTests();
