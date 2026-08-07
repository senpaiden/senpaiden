import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const genre = searchParams.get('genre');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 24;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('manga')
      .select('id, title, cover_url, status, genres, description, latest_chapter_number, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (q && q.trim() !== '') {
      query = query.ilike('title', `%${q}%`);
    }

    if (genre && genre.trim() !== '') {
      query = query.contains('genres', [genre]);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [], total: count || 0, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
