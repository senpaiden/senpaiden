import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase environment variables not configured.' }, { status: 500 });
    }

    const { id } = await params;

    // Query manga by id (UUID or slug)
    const { data: manga, error: mangaErr } = await supabase
      .from('manga')
      .select('*')
      .eq('id', id)
      .single();

    if (mangaErr || !manga) {
      return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
    }

    // Query chapters for this manga
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, title, job_status, language, scanlation_group, created_at')
      .eq('manga_id', id)
      .order('chapter_number', { ascending: true });

    return NextResponse.json({
      ...manga,
      chapters: chapters || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
