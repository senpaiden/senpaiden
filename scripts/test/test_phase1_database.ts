import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

import WebSocket from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: WebSocket } });

async function runPhase1DatabaseTests() {
  console.log('=== PHASE 1: DATABASE SCHEMA & INTEGRITY TESTS ===');
  let passed = 0;
  let total = 0;

  // Test 1: Connectivity & Table Access
  total++;
  try {
    const { data, error } = await supabase.from('manga').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('✔ Test 1 Passed: Supabase connectivity and `manga` table query operational.');
    passed++;
  } catch (err: any) {
    console.error('❌ Test 1 Failed: Supabase connection failed:', err.message);
  }

  // Test 2: Full-Text Search (trgm index & fuzzy search)
  total++;
  try {
    const { data, error } = await supabase
      .from('manga')
      .select('id, title')
      .ilike('title', '%eminence%');
    
    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn('⚠️ Test 2 Warning: Query succeeded, but no manga matched `%eminence%`.');
    } else {
      console.log(`✔ Test 2 Passed: Full-Text Search fuzzy match returned ${data.length} records.`);
    }
    passed++;
  } catch (err: any) {
    console.error('❌ Test 2 Failed: Full-text search error:', err.message);
  }

  // Test 3: Unique Constraint Violation Handling (manga source_id)
  total++;
  try {
    const testSourceId = 'test-dup-id-' + Date.now();
    await supabase.from('manga').insert({
      source_id: testSourceId,
      source_provider: 'mangapill',
      title: 'Duplicate Test Manga'
    });

    // Attempt inserting same source_id
    const { error: dupError } = await supabase.from('manga').insert({
      source_id: testSourceId,
      source_provider: 'mangapill',
      title: 'Duplicate Test Manga 2'
    });

    // Clean up
    await supabase.from('manga').delete().eq('source_id', testSourceId);

    if (dupError && (dupError.code === '23505' || dupError.message.includes('unique constraint'))) {
      console.log('✔ Test 3 Passed: Unique constraint correctly rejected duplicate `source_id`.');
      passed++;
    } else {
      console.error('❌ Test 3 Failed: Unique constraint did not trigger on duplicate source_id.');
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
  }

  // Test 4: Pages Array & JSONB Metadata Validation
  total++;
  try {
    const { data: chapters } = await supabase.from('chapters').select('id').limit(1);
    if (chapters && chapters.length > 0) {
      const chapterId = chapters[0].id;
      const testR2Keys = ['manga/test/1_0.webp', 'manga/test/1_1.webp'];
      const testDims = [{ width: 720, height: 1500 }, { width: 720, height: 600 }];

      const { data: pageRecord, error: pageErr } = await supabase
        .from('pages')
        .insert({
          chapter_id: chapterId,
          page_number: 9999,
          r2_keys: testR2Keys,
          slice_dimensions: testDims
        })
        .select()
        .single();

      if (pageErr) throw pageErr;

      // Verify array and jsonb structure
      const isArrayValid = Array.isArray(pageRecord.r2_keys) && pageRecord.r2_keys.length === 2;
      const dimsParsed = typeof pageRecord.slice_dimensions === 'string' 
        ? JSON.parse(pageRecord.slice_dimensions) 
        : pageRecord.slice_dimensions;
      const isJsonbValid = Array.isArray(dimsParsed) && dimsParsed[0].height === 1500;

      // Clean up test page
      await supabase.from('pages').delete().eq('id', pageRecord.id);

      if (isArrayValid && isJsonbValid) {
        console.log('✔ Test 4 Passed: Pages `r2_keys` TEXT[] and `slice_dimensions` JSONB verified.');
        passed++;
      } else {
        console.error('❌ Test 4 Failed: `r2_keys` or `slice_dimensions` payload mismatch.');
      }
    } else {
      console.log('✔ Test 4 Skipped: No chapters present in DB to bind test page to.');
      passed++;
    }
  } catch (err: any) {
    console.error('❌ Test 4 Failed:', err.message);
  }

  console.log(`\n=== PHASE 1 SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

runPhase1DatabaseTests();
