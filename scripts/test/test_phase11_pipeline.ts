import http from 'http';
import { FireFlyAdapter } from '../../github-action/src/providers/FireFlyAdapter';

async function verifyEndToEndPipeline() {
  console.log('=== END-TO-END PIPELINE AUDIT: 10 REAL MANGA TITLES ===\n');

  let passed = 0;
  let total = 0;

  // Test 1: Fetch Latest Manga List from Provider Adapter
  total++;
  try {
    const firefly = new FireFlyAdapter();
    const mangas = await firefly.fetchLatestManga(1);

    if (Array.isArray(mangas) && mangas.length >= 10) {
      console.log(`✔ Test 1 Passed: Successfully fetched all ${mangas.length} real manga titles from Provider Adapter!`);
      mangas.forEach((m, idx) => {
        console.log(`   [${idx + 1}] ${m.title} (${m.author}) — Genres: ${m.genres.join(', ')}`);
      });
      passed++;
    } else {
      console.error(`❌ Test 1 Failed: Expected >= 10 manga titles, got ${mangas?.length || 0}`);
    }
  } catch (err: any) {
    console.error(`❌ Test 1 Failed: ${err.message}`);
  }

  // Test 2: Verify Chapters for Ingested Titles
  total++;
  try {
    const firefly = new FireFlyAdapter();
    const testSlug = 'chainsaw-man';
    const chapters = await firefly.fetchChapterList(testSlug);

    if (Array.isArray(chapters) && chapters.length > 0) {
      console.log(`\n✔ Test 2 Passed: Fetched ${chapters.length} chapters for '${testSlug}'!`);
      chapters.forEach(ch => console.log(`   + Chapter ${ch.chapterNumber}: ${ch.title}`));
      passed++;
    } else {
      console.error(`❌ Test 2 Failed: Chapter list empty for '${testSlug}'`);
    }
  } catch (err: any) {
    console.error(`❌ Test 2 Failed: ${err.message}`);
  }

  // Test 3: Verify Page Images Ingestion Pipeline
  total++;
  try {
    const firefly = new FireFlyAdapter();
    const testChapterId = 'chainsaw-man-1';
    const pages = await firefly.fetchChapterPages(testChapterId);

    if (Array.isArray(pages) && pages.length >= 20) {
      console.log(`\n✔ Test 3 Passed: Ingestion pipeline loaded ${pages.length} high-res page image URLs for chapter '${testChapterId}'!`);
      passed++;
    } else {
      console.error(`❌ Test 3 Failed: Page images list invalid for '${testChapterId}'`);
    }
  } catch (err: any) {
    console.error(`❌ Test 3 Failed: ${err.message}`);
  }

  console.log(`\n=== END-TO-END PIPELINE SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

verifyEndToEndPipeline();
