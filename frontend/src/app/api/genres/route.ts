import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ genres: [] });
    }

    const { data: genresData, error } = await supabase.from('genres').select('name, slug').order('name');
    if (!error && genresData && genresData.length > 0) {
      return NextResponse.json({ genres: genresData });
    }

    // Fallback: collect unique genres from manga table
    const { data: mangaData } = await supabase.from('manga').select('genres');
    const genreSet = new Set<string>();
    (mangaData || []).forEach((row: any) => {
      if (Array.isArray(row.genres)) {
        row.genres.forEach((g: string) => genreSet.add(g));
      }
    });

    const fallbackGenres = Array.from(genreSet).sort().map(g => ({ name: g, slug: g.toLowerCase() }));
    return NextResponse.json({ genres: fallbackGenres });
  } catch (err: any) {
    return NextResponse.json({ genres: [] });
  }
}
