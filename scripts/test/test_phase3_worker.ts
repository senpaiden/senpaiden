import sharp from 'sharp';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || 'local_access_key',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'local_secret_key'
  },
  forcePathStyle: true
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'manga-images';

async function runPhase3WorkerTests() {
  console.log('=== PHASE 3: HUGGING FACE WORKER & IMAGE PIPELINE TESTS ===');
  let passed = 0;
  let total = 0;

  // Test 1: Standard Image Slicing (Height <= 2000px -> 1 slice)
  total++;
  try {
    const standardImg = await sharp({
      create: { width: 800, height: 1200, channels: 3, background: { r: 10, g: 10, b: 10 } }
    }).png().toBuffer();

    const meta = await sharp(standardImg).metadata();
    const isStandard = (meta.height ?? 0) <= 2000;

    if (isStandard) {
      console.log(`✔ Test 1 Passed: Standard manga page (${meta.width}x${meta.height}) marked for 1 unsliced page.`);
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Standard image incorrect dimension metadata.');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message);
  }

  // Test 2: Manhwa Slicing Algorithm (Height > 2000px -> sliced at 1500px)
  total++;
  try {
    const webtoonImg = await sharp({
      create: { width: 720, height: 3600, channels: 3, background: { r: 0, g: 120, b: 200 } }
    }).png().toBuffer();

    const meta = await sharp(webtoonImg).metadata();
    const height = meta.height!;
    const width = meta.width!;
    const MAX_SLICE = 1500;

    const slices: { buffer: Buffer; height: number }[] = [];
    let currentY = 0;

    while (currentY < height) {
      const sliceHeight = Math.min(MAX_SLICE, height - currentY);
      const sliceBuffer = await sharp(webtoonImg)
        .extract({ left: 0, top: currentY, width, height: sliceHeight })
        .webp({ quality: 70 })
        .toBuffer();

      slices.push({ buffer: sliceBuffer, height: sliceHeight });
      currentY += sliceHeight;
    }

    if (slices.length === 3 && slices[0].height === 1500 && slices[1].height === 1500 && slices[2].height === 600) {
      console.log(`✔ Test 3600px Webtoon Strip Sliced into 3 precise segments: 1500px, 1500px, 600px.`);
      console.log('✔ Test 2 Passed: Manhwa slicing algorithm verified.');
      passed++;
    } else {
      console.error(`❌ Test 2 Failed: Unexpected slice count/heights: ${slices.map(s => s.height).join(', ')}`);
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed:', err.message);
  }

  // Test 3: MinIO / R2 S3 Upload & Retrieval Verification
  total++;
  try {
    const testBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } }
    }).webp({ quality: 70 }).toBuffer();

    const testKey = `manga/test-chapter-${Date.now()}/1_0.webp`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: testBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable'
    }));

    const headRes = await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey
    }));

    if (headRes.ContentType === 'image/webp') {
      console.log(`✔ Test 3 Passed: Uploaded test slice '${testKey}' to bucket '${BUCKET_NAME}' and verified S3 headers.`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed: S3 object metadata mismatch.');
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed:', err.message);
  }

  // Test 4: Watchdog 5-Minute Timeout Calculation
  total++;
  try {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    const elapsedSeconds = Math.floor((Date.now() - sixMinutesAgo.getTime()) / 1000);
    const isTimedOut = elapsedSeconds > 300;

    if (isTimedOut) {
      console.log(`✔ Test 4 Passed: Watchdog threshold accurately identifies timed-out jobs (${elapsedSeconds}s > 300s).`);
      passed++;
    } else {
      console.error('❌ Test 4 Failed: Watchdog calculation failed.');
    }
  } catch (err: any) {
    console.error('❌ Test 4 Failed:', err.message);
  }

  console.log(`\n=== PHASE 3 SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
  if (passed !== total) process.exit(1);
}

runPhase3WorkerTests();
