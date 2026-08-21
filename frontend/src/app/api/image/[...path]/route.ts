import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { fetchFileFromGDrive } from '@/lib/gdrive';

function getS3Client() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: process.env.R2_REGION || 'us-east-005',
    endpoint: process.env.R2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join('/');

  if (!key) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // 1. Direct Google Drive fileId path: /api/image/gdrive/<fileId>
  if (path[0] === 'gdrive' && path[1]) {
    const fileId = path[1];
    const decryptedBuffer = await fetchFileFromGDrive(fileId);
    if (decryptedBuffer) {
      return new NextResponse(decryptedBuffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  const s3 = getS3Client();
  const bucketName = process.env.R2_BUCKET_NAME || 'senpaiden-mangas';

  // 2. Primary: Backblaze B2 S3 storage
  try {
    if (s3) {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3.send(command);

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
    // 3. Fallback: Supabase Storage for legacy uploaded images
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
