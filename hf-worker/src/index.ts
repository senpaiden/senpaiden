// ============================================================
// HF Worker — Main Image Processing Pipeline (Phase 3)
//
// 1. Express health check (Port 7860) to keep HF Space alive
// 2. 60s Watchdog: Handles 5-minute processing timeouts
// 3. 10s Poll Loop: Claims QUEUED jobs, downloads, slices, uploads to R2
// ============================================================

import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import WebSocket from 'ws';

// ── Configuration & Clients ───────────────────────────────────────────────────
const PORT = process.env.PORT || 7860;
const MAX_SLICE_HEIGHT = 1500;
const WEBP_QUALITY = 75;
const TIMEOUT_MINUTES = 5;

// ── Supabase client (service role — full write access) ──────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: { persistSession: false },
    realtime: { transport: WebSocket } // Fix for Node 20 WebSocket support
  }
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: !!process.env.R2_ENDPOINT, // Required for MinIO
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? 'manga-images';

// ── Health Check Server ───────────────────────────────────────────────────────
const app = express();
app.get('/', (req, res) => res.json({ status: 'ok', worker: 'senpai-den-hf' }));
app.listen(PORT, () => console.log(`[Worker] Health check listening on port ${PORT}`));

// ── Types ─────────────────────────────────────────────────────────────────────
interface SliceDimension {
  width: number;
  height: number;
}

interface ProcessedPage {
  page_number: number;
  r2_keys: string[];
  slice_dimensions: SliceDimension[];
}

// ── 1. Watchdog: Timeout Handler ──────────────────────────────────────────────
async function runWatchdog() {
  try {
    // Find chapters PROCESSING for > 5 minutes
    const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000).toISOString();
    
    const { data: timedOutChapters, error: fetchErr } = await supabase
      .from('chapters')
      .select('id')
      .eq('job_status', 'PROCESSING')
      .lt('processing_started_at', cutoff);

    if (fetchErr) throw fetchErr;
    if (!timedOutChapters || timedOutChapters.length === 0) return;

    for (const chapter of timedOutChapters) {
      console.warn(`[Watchdog] Chapter ${chapter.id} timed out. Marking FAILED.`);
      
      // Mark FAILED
      await supabase
        .from('chapters')
        .update({ job_status: 'FAILED', updated_at: new Date().toISOString() })
        .eq('id', chapter.id);
        
      // Insert DLQ
      await supabase.from('dead_letter_queue').insert({
        chapter_id: chapter.id,
        error_type: 'PROCESSING_TIMEOUT',
        error_detail: `Worker timed out after ${TIMEOUT_MINUTES} minutes.`,
        max_retries: parseInt(process.env.DLQ_MAX_RETRIES ?? '3', 10),
      });
    }
  } catch (err) {
    console.error(`[Watchdog] Error:`, err);
  }
}
setInterval(runWatchdog, 60 * 1000); // Run every 60s

// ── 2. Image Processing Core ──────────────────────────────────────────────────

// Download with exponential backoff
async function downloadImage(url: string, retries = 3): Promise<Buffer> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (i === retries - 1) throw new Error(`Failed to download ${url} after ${retries} attempts: ${err}`);
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // 1s, 2s, 4s
    }
  }
  throw new Error('Unreachable');
}

// Slice image at 1500px boundaries and convert to WebP
async function processImage(buffer: Buffer): Promise<{ buffers: Buffer[], dimensions: SliceDimension[] }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image metadata');
  }

  const { width, height } = metadata;
  const buffers: Buffer[] = [];
  const dimensions: SliceDimension[] = [];

  let currentY = 0;
  while (currentY < height) {
    const sliceHeight = Math.min(MAX_SLICE_HEIGHT, height - currentY);
    
    const sliceBuffer = await sharp(buffer)
      .extract({ left: 0, top: currentY, width, height: sliceHeight })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    buffers.push(sliceBuffer);
    dimensions.push({ width, height: sliceHeight });
    
    currentY += sliceHeight;
  }

  return { buffers, dimensions };
}

// Upload buffer to R2
async function uploadToR2(key: string, buffer: Buffer): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable'
  }));
}

// ── 3. Main Poll Loop ─────────────────────────────────────────────────────────
async function processNextJob() {
  try {
    // 1. Claim a QUEUED job
    const { data: qData, error: qErr } = await supabase
      .from('chapters')
      .select('id, manga_id, chapter_number, source_url')
      .eq('job_status', 'QUEUED')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (qErr) throw qErr;
    if (!qData) return; // No jobs

    const chapterId = qData.id;
    console.log(`[Worker] Claiming Chapter ${chapterId} (Ch. ${qData.chapter_number})`);

    // Lock it
    const { error: lockErr } = await supabase
      .from('chapters')
      .update({ job_status: 'PROCESSING', processing_started_at: new Date().toISOString() })
      .eq('id', chapterId)
      .eq('job_status', 'QUEUED');

    if (lockErr) throw lockErr;

    // Everything after this point operates on the locked chapter
    try {
      // 2. Fetch image URLs from Provider API
      console.log(`[Worker] Fetching source images from: ${qData.source_url}`);
      const sourceRes = await fetch(qData.source_url);
      if (!sourceRes.ok) throw new Error(`Provider HTTP ${sourceRes.status} for images`);
      
      const sourceData = await sourceRes.json();
      const imageUrls: string[] = sourceData.images ?? sourceData.data ?? sourceData.chapterImages?.map((i: any) => i.image ?? i) ?? [];
      
      if (imageUrls.length === 0) throw new Error('No images returned by provider endpoint');

      // 3. Process each page sequentially
      const processedPages: ProcessedPage[] = [];
      let pageNumber = 1;

      for (const url of imageUrls) {
        if (typeof url !== 'string' || !url.startsWith('http')) continue;
        
        console.log(`[Worker] Processing page ${pageNumber}/${imageUrls.length}...`);
        const rawBuffer = await downloadImage(url);
        const { buffers, dimensions } = await processImage(rawBuffer);

        const r2Keys: string[] = [];
        for (let sliceIdx = 0; sliceIdx < buffers.length; sliceIdx++) {
          const key = `manga/${chapterId}/${pageNumber}_${sliceIdx}.webp`;
          await uploadToR2(key, buffers[sliceIdx]!);
          r2Keys.push(key);
        }

        processedPages.push({
          page_number: pageNumber,
          r2_keys: r2Keys,
          slice_dimensions: dimensions
        });

        pageNumber++;
      }

      // 4. Save to Database
      console.log(`[Worker] Saving ${processedPages.length} pages to DB...`);
      for (const page of processedPages) {
        await supabase.from('pages').insert({
          chapter_id: chapterId,
          page_number: page.page_number,
          r2_keys: page.r2_keys,
          slice_dimensions: JSON.stringify(page.slice_dimensions),
        });
      }

      // 5. Mark READY
      await supabase
        .from('chapters')
        .update({ job_status: 'READY', updated_at: new Date().toISOString() })
        .eq('id', chapterId);

      console.log(`[Worker] Chapter ${chapterId} COMPLETE. ✓`);

    } catch (innerErr) {
      console.error(`[Worker] Job Failed for chapter ${chapterId}:`, innerErr);
      
      // Cleanup: Mark FAILED and DLQ
      await supabase
        .from('chapters')
        .update({ job_status: 'FAILED', updated_at: new Date().toISOString() })
        .eq('id', chapterId);
        
      await supabase.from('dead_letter_queue').insert({
        chapter_id: chapterId,
        error_type: 'PROCESSING_ERROR',
        error_detail: String(innerErr),
        max_retries: parseInt(process.env.DLQ_MAX_RETRIES ?? '3', 10),
      });
    }

  } catch (err) {
    console.error(`[Worker] Polling/Locking Failed:`, err);
  }
}

// Ensure the loop runs sequentially and pauses between runs
async function pollLoop() {
  while (true) {
    try {
      await processNextJob();
    } catch (err) {
      console.error('[Worker] Fatal loop error:', err);
    }
    // Wait 10 seconds before polling again
    await new Promise(r => setTimeout(r, 10000));
  }
}

// Start loop
setTimeout(pollLoop, 1000);
