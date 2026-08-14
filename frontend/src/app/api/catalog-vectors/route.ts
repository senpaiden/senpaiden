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

    let { data: items, error } = await supabase
      .from('manga')
      .select('id, title, cover_url, status, genres, client_vector')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      const fallback = await supabase
        .from('manga')
        .select('id, title, cover_url, status, genres')
        .order('updated_at', { ascending: false })
        .limit(100);
      items = fallback.data as any;
    }

    const mapped = (items || []).map((item: any) => ({
      slug: item.id,
      title: item.title,
      cover_url: item.cover_url,
      status: item.status,
      genres: item.genres,
      client_vector: item.client_vector || null,
    }));

    return NextResponse.json({ catalog: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
