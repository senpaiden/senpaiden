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
      return NextResponse.json(
        { genres: genresData },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    }

    // Fallback: collect unique genres from manga table
    const { data: mangaData } = await supabase.from('manga').select('genres');
    const genreSet = new Set<string>();
    (mangaData || []).forEach((row) => {
      const genres = (row as { genres?: string[] }).genres;
      if (Array.isArray(genres)) {
        genres.forEach((g) => genreSet.add(g));
      }
    });

    const fallbackGenres = Array.from(genreSet).sort().map(g => ({ name: g, slug: g.toLowerCase() }));
    return NextResponse.json(
      { genres: fallbackGenres },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch {
    return NextResponse.json({ genres: [] });
  }
}
