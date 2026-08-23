import { NextResponse } from 'next/server';
import { getCachedGenres } from '@/lib/cache';

export async function GET() {
  try {
    const genres = await getCachedGenres();
    return NextResponse.json(
      { genres },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch {
    return NextResponse.json({ genres: [] });
  }
}
