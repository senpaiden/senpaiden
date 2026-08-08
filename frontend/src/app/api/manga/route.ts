import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set in environment settings.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const genre = searchParams.get('genre');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('manga')
      .select('id, title, cover_url, status, genres, description, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (q && q.trim() !== '') {
      query = query.ilike('title', `%${q}%`);
    }

    if (genre && genre.trim() !== '' && genre !== 'All') {
      query = query.contains('genres', [genre]);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [], total: count || 0, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
