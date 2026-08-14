import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chapter: string }> }
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase environment variables not configured.' }, { status: 500 });
    }

    const { id: mangaId, chapter: chapterNumStr } = await params;
    const chapterNumber = parseFloat(chapterNumStr);

    // Fetch manga details
    const { data: manga, error: mangaErr } = await supabase
      .from('manga')
      .select('*')
      .eq('id', mangaId)
      .single();

    if (mangaErr || !manga) {
      return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
    }

    // Fetch all chapters for navigation
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, title, job_status, language, scanlation_group')
      .eq('manga_id', mangaId)
      .order('chapter_number', { ascending: true });

    // Fetch current target chapter
    const { data: chapter, error: chErr } = await supabase
      .from('chapters')
      .select('*')
      .eq('manga_id', mangaId)
      .eq('chapter_number', chapterNumber)
      .single();

    if (chErr || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (chapter.job_status !== 'READY' && chapter.job_status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Chapter is currently being processed', job_status: chapter.job_status },
        { status: 400 }
      );
    }

    // Fetch pages for this chapter
    const { data: pages } = await supabase
      .from('pages')
      .select('*')
      .eq('chapter_id', chapter.id)
      .order('page_number', { ascending: true });

    const available_languages = Array.from(
      new Set((chapters || []).map((c: any) => c.language).filter(Boolean))
    );

    return NextResponse.json({
      manga,
      chapter,
      chapters: chapters || [],
      pages: pages || [],
      available_languages: available_languages.length > 0 ? available_languages : ['en'],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
