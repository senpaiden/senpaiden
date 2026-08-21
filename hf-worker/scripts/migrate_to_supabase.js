import http from 'http';
import https from 'https';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

const SUPABASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';
const BUCKET = 'manga-images';

// Local MinIO client
const s3 = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'local_access_key',
    secretAccessKey: 'local_secret_key',
  },
  forcePathStyle: true,
});

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function uploadToSupabase(key, buffer, contentType = 'image/webp') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`);
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
          'Content-Length': buffer.length,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

async function migrate() {
  console.log('🚀 Starting MinIO -> Supabase Storage Migration...');
  let continuationToken = undefined;
  let totalUploaded = 0;
  let totalFailed = 0;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: 'manga-images',
        ContinuationToken: continuationToken,
      })
    );

    const objects = res.Contents || [];
    console.log(`📦 Found ${objects.length} files in batch...`);

    const BATCH_SIZE = 15;
    for (let i = 0; i < objects.length; i += BATCH_SIZE) {
      const batch = objects.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (obj) => {
          try {
            const fileData = await s3.send(
              new GetObjectCommand({ Bucket: 'manga-images', Key: obj.Key })
            );
            const buffer = await streamToBuffer(fileData.Body);
            await uploadToSupabase(obj.Key, buffer, fileData.ContentType || 'image/webp');
            totalUploaded++;
            if (totalUploaded % 50 === 0 || totalUploaded === objects.length) {
              console.log(`✅ Uploaded ${totalUploaded} / ${objects.length} files...`);
            }
          } catch (err) {
            totalFailed++;
            console.error(`❌ Failed to upload ${obj.Key}:`, err.message);
          }
        })
      );
    }

    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  console.log(`🎉 Migration Complete! Successfully migrated ${totalUploaded} files (${totalFailed} failed).`);
}

migrate().catch(console.error);
