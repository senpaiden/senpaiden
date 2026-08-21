import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ data: [] });
    }

    const { id } = await params;

    // Fetch related mangas excluding current id
    const { data: mangas } = await supabase
      .from('manga')
      .select('id, title, cover_url, status, genres, description')
      .neq('id', id)
      .limit(6);

    return NextResponse.json(
      { data: mangas || [] },
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
