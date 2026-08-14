import { notFound, redirect } from "next/navigation";
import { MangaReaderContainer } from "@/components/MangaReaderContainer";
import { fetchApi } from "@/lib/api-client";
import { getApiUrl } from "@/lib/api";

export const revalidate = 31536000; 

export default async function ReaderPage({ params }: { params: Promise<{ id: string, chapter: string }> }) {
  const resolvedParams = await params;
  const apiUrl = getApiUrl();
  
  try {
    const compoundRes = await fetch(`${apiUrl}/api/manga/${resolvedParams.id}/chapter/${resolvedParams.chapter}`);
    
    if (!compoundRes.ok) {
      if (compoundRes.status === 400) {
        redirect(`/manga/${resolvedParams.id}/${resolvedParams.chapter}/processing`);
      }
      notFound();
    }
    
    const { manga, chapter, chapters, pages, available_languages } = await compoundRes.json();
    const freshness = compoundRes.headers.get('x-content-freshness') as "fresh" | "stale" | "archived" | null;
    
    fetchApi(`/api/chapter/${chapter.id}/read`, { method: 'POST' }).catch(() => {});
    
    const allSlices: { key: string, width: number, height: number, blurhash?: string }[] = [];
    const pageGroups: { pageNumber: number; slices: { key: string; width: number; height: number; blurhash?: string }[] }[] = [];

    interface RawPage {
      page_number?: number;
      r2_keys: string[];
      slice_dimensions?: unknown;
      blurhash?: unknown;
    }

    pages?.forEach((page: RawPage, pageIdx: number) => {
      const r2Keys = page.r2_keys || [];
      let dims: { width?: number; height?: number }[] = [];
      try {
        dims = typeof page.slice_dimensions === 'string' 
          ? JSON.parse(page.slice_dimensions) 
          : (Array.isArray(page.slice_dimensions) ? page.slice_dimensions : []);
      } catch {}
        
      let bHashes: unknown = page.blurhash;
      try {
        if (typeof page.blurhash === 'string' && page.blurhash.startsWith('[')) {
          bHashes = JSON.parse(page.blurhash);
        }
      } catch {}
        
      const pSlices: { key: string; width: number; height: number; blurhash?: string }[] = [];
      r2Keys.forEach((key, idx) => {
        let cleanKey = key;
        if (cleanKey.includes('.mangadex.network/data/')) {
          cleanKey = cleanKey.replace(/https?:\/\/[^\/]+\.mangadex\.network\/data\//, 'https://uploads.mangadex.org/data/');
        }
        const dim = (Array.isArray(dims) && dims[idx]) ? dims[idx] : { width: 800, height: 1200 };
        const bHash = Array.isArray(bHashes) ? bHashes[idx] : (typeof bHashes === 'string' ? bHashes : undefined);
        const item = {
          key: cleanKey,
          width: dim.width || 800,
          height: dim.height || 1200,
          blurhash: bHash
        };
        allSlices.push(item);
        pSlices.push(item);
      });

      pageGroups.push({
        pageNumber: page.page_number || (pageIdx + 1),
        slices: pSlices
      });
    });

    const r2BaseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://lsdnqbfiytyonvmzurxj.supabase.co/storage/v1/object/public/manga-images';

    return (
      <MangaReaderContainer
        mangaId={resolvedParams.id}
        mangaTitle={manga.title || "Manga Reader"}
        mangaCoverUrl={manga.cover_url}
        chapterNumber={resolvedParams.chapter}
        chapters={chapters || []}
        slices={allSlices}
        pageGroups={pageGroups}
        freshness={freshness ?? undefined}
        r2BaseUrl={r2BaseUrl}
        availableLanguages={available_languages || ["en", "es", "fr"]}
        currentLanguage={chapter?.language || "en"}
      />
    );
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    notFound();
  }
}
