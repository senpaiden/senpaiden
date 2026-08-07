import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjUzMDUsImV4cCI6MjEwMDQ0MTMwNX0.-Hxi0RLRwVDQVeRV8EGgVkDwTKZRr_QhIsaQhfSGaQc';

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
