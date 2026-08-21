import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set in environment settings.' },
        { status: 500 }
      );
    }

    const { data: initialItems, error } = await supabase
      .from('manga')
      .select('id, title, cover_url, status, genres, client_vector')
      .order('updated_at', { ascending: false })
      .limit(100);

    let items: Array<{
      id: string;
      title: string;
      cover_url?: string | null;
      status?: string | null;
      genres?: string[] | null;
      client_vector?: unknown;
    }> | null = initialItems;

    if (error) {
      const fallback = await supabase
        .from('manga')
        .select('id, title, cover_url, status, genres')
        .order('updated_at', { ascending: false })
        .limit(100);
      items = fallback.data;
    }

    const mapped = (items || []).map((item) => ({
      slug: item.id,
      title: item.title,
      cover_url: item.cover_url,
      status: item.status,
      genres: item.genres,
      client_vector: (item as { client_vector?: unknown }).client_vector || null,
    }));

    return NextResponse.json(
      { catalog: mapped },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
