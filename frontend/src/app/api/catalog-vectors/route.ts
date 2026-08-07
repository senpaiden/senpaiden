import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
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
      genres: item.genres || [],
      client_vector: Array.isArray(item.client_vector) && item.client_vector.length === 16 
        ? item.client_vector 
        : [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
    }));

    return NextResponse.json({ data: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
