import { NextRequest, NextResponse } from 'next/server';
import { getCachedRecommendations } from '@/lib/cache';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mangas = await getCachedRecommendations(id);

    return NextResponse.json(
      { data: mangas },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch {
    return NextResponse.json({ data: [] });
  }
}
