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

    const { data, error } = await supabase.from('genres').select('name, slug').order('name');
    if (error) throw error;

    return NextResponse.json({ genres: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
