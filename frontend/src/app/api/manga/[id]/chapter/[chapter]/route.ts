import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { resolveMangaRecord } from '@/lib/cache';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chapter: string }> }
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase environment variables not configured.' }, { status: 500 });
    }

    const { id: rawMangaId, chapter: chapterNumStr } = await params;
    const chapterNumber = parseFloat(chapterNumStr);

    // Fetch manga details via universal resolver (UUID, slug, title, or source_id)
    const manga = await resolveMangaRecord(rawMangaId, supabase);
    if (!manga) {
      return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
    }
    const mangaId = manga.id;

    // Fetch all chapters for navigation (up to 5,000 for long-running series)
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, title, job_status, language, scanlation_group')
      .eq('manga_id', mangaId)
      .order('chapter_number', { ascending: true })
      .limit(5000);

    // Fetch current target chapter (prioritizing English and READY status)
    const { data: candidateChapters, error: chErr } = await supabase
      .from('chapters')
      .select('*')
      .eq('manga_id', mangaId)
      .eq('chapter_number', chapterNumber)
      .limit(10);

    if (chErr || !candidateChapters || candidateChapters.length === 0) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Pick English or first ready candidate
    const chapter = candidateChapters.find((c) => c.language === 'en') || candidateChapters[0];

    if (chapter.job_status !== 'READY' && chapter.job_status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Chapter is currently being processed', job_status: chapter.job_status },
        { status: 400 }
      );
    }

    // Fetch pages for this chapter
    let { data: pages } = await supabase
      .from('pages')
      .select('*')
      .eq('chapter_id', chapter.id)
      .order('page_number', { ascending: true });

    // Fallback: If pages are missing or only contain unauthenticated gdrive keys, resolve live MangaDex pages
    const hasOnlyGdrive = pages && pages.length > 0 && pages.every(p => Array.isArray(p.r2_keys) && p.r2_keys.every((k: string) => k.startsWith('gdrive/')));
    if (!pages || pages.length === 0 || hasOnlyGdrive) {
      try {
        let chapterUuid = '';
        if (chapter.source_url && chapter.source_url.includes('mangadex.org/chapter/')) {
          chapterUuid = chapter.source_url.split('mangadex.org/chapter/')[1]?.split('/')[0]?.split('?')[0] || '';
        }

        if (!chapterUuid && manga.source_id && /^[0-9a-f-]{36}$/i.test(manga.source_id)) {
          const chRes = await fetch(
            `https://api.mangadex.org/chapter?manga=${manga.source_id}&chapter=${chapterNumber}&limit=5`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (chRes.ok) {
            const chData = await chRes.json();
            if (chData.data && chData.data.length > 0) {
              const enCh = chData.data.find((c: any) => c.attributes.translatedLanguage === 'en') || chData.data[0];
              chapterUuid = enCh.id;
            }
          }
        }

        if (chapterUuid) {
          const atHomeRes = await fetch(
            `https://api.mangadex.org/at-home/server/${chapterUuid}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (atHomeRes.ok) {
            const atHomeJson = await atHomeRes.json();
            const hash = atHomeJson.chapter?.hash;
            const files = atHomeJson.chapter?.data || [];
            if (hash && files.length > 0) {
              const livePages = files.map((file: string, idx: number) => ({
                chapter_id: chapter.id,
                page_number: idx + 1,
                r2_keys: [`https://uploads.mangadex.org/data/${hash}/${file}`],
                slice_dimensions: [{ width: 800, height: 1200 }],
              }));

              // Background update to cache in Supabase
              (async () => {
                try {
                  await supabase.from('pages').delete().eq('chapter_id', chapter.id);
                  await supabase.from('pages').insert(livePages);
                } catch {}
              })();

              pages = livePages as any;
            }
          }
        }
      } catch (err) {
        console.warn('[Chapter Route] Live MangaDex page fetch fallback error:', err);
      }
    }

    const available_languages = Array.from(
      new Set((chapters || []).map((c) => (c as { language?: string }).language).filter(Boolean))
    );

    return NextResponse.json({
      manga,
      chapter,
      chapters: chapters || [],
      pages: pages || [],
      available_languages: available_languages.length > 0 ? available_languages : ['en'],
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
