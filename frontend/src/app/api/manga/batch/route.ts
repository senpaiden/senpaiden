import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ data: [] }, { status: 500 });
    }

    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter(Boolean).slice(0, 50) : [];

    if (ids.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch all requested manga in a single query
    const { data: mangas, error } = await supabase
      .from('manga')
      .select('id, title, alt_title, description, cover_url, status, genres, author, updated_at')
      .in('id', ids);

    if (error) {
      return NextResponse.json({ data: [] }, { status: 500 });
    }

    return NextResponse.json({ data: mangas || [] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
