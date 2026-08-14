import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const B2_ENDPOINT = process.env.R2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const B2_REGION = process.env.R2_REGION || 'us-east-005';
const B2_BUCKET = process.env.R2_BUCKET_NAME || 'senpaiden-mangas';
const B2_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const B2_APP_KEY = process.env.R2_SECRET_ACCESS_KEY;

const s3Client = B2_KEY_ID && B2_APP_KEY ? new S3Client({
  region: B2_REGION,
  endpoint: B2_ENDPOINT,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
}) : null;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join('/');

  if (!key) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  try {
    // 1. Attempt to fetch from Backblaze B2
    if (s3Client) {
      const command = new GetObjectCommand({
        Bucket: B2_BUCKET,
        Key: key,
      });

      const response = await s3Client.send(command);

      if (response.Body) {
        const byteArray = await response.Body.transformToByteArray();
        const contentType = response.ContentType || 'image/webp';

        return new NextResponse(Buffer.from(byteArray), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }
  } catch (b2Error) {
    // 2. Fallback to Supabase Storage for legacy uploaded images
    try {
      const fallbackUrl = `https://lsdnqbfiytyonvmzurxj.supabase.co/storage/v1/object/public/manga-images/${key}`;
      const fallbackRes = await fetch(fallbackUrl);

      if (fallbackRes.ok) {
        const fallbackBlob = await fallbackRes.arrayBuffer();
        const contentType = fallbackRes.headers.get('content-type') || 'image/webp';

        return new NextResponse(fallbackBlob, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch {
      // Ignore fallback errors
    }
  }

  return new NextResponse('Image Not Found', { status: 404 });
}
