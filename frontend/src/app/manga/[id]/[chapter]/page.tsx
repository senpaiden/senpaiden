import { notFound, redirect } from "next/navigation";
import { MangaReaderContainer } from "@/components/MangaReaderContainer";

import { getApiUrl } from "@/lib/api";

// Cache immutable chapters forever. Stale chapters are cached for 60s at the edge.
export const revalidate = 31536000; 

// Removed getChapterPages function as it is superseded by the compound fetch route.

export default async function ReaderPage({ params }: { params: Promise<{ id: string, chapter: string }> }) {
  const resolvedParams = await params;
  const apiUrl = getApiUrl();
  
  try {
    // P3-C Fix: Single compound fetch instead of waterfall
    const compoundRes = await fetch(`${apiUrl}/api/manga/${resolvedParams.id}/chapter/${resolvedParams.chapter}`);
    
    if (!compoundRes.ok) {
      if (compoundRes.status === 400) {
        // Not ready, redirect to processing
        redirect(`/manga/${resolvedParams.id}/${resolvedParams.chapter}/processing`);
      }
      notFound();
    }
    
    const { manga, chapter, chapters, pages, available_languages } = await compoundRes.json();
    const freshness = compoundRes.headers.get('x-content-freshness') as "fresh" | "stale" | "archived" | null;
    
    // Trigger read increment asynchronously
    fetch(`${apiUrl}/api/chapter/${chapter.id}/read`, { method: 'POST' }).catch(() => {});

    // Re-flatten the slices into a single array for rendering
    const allSlices: { key: string, width: number, height: number, blurhash?: string }[] = [];
    pages?.forEach((page: { r2_keys: string[]; slice_dimensions?: any; blurhash?: any }) => {
      const r2Keys = page.r2_keys || [];
      let dims: any[] = [];
      try {
        dims = typeof page.slice_dimensions === 'string' 
          ? JSON.parse(page.slice_dimensions) 
          : (Array.isArray(page.slice_dimensions) ? page.slice_dimensions : []);
      } catch (e) {}
        
      let bHashes: any = page.blurhash;
      try {
        if (typeof page.blurhash === 'string' && page.blurhash.startsWith('[')) {
          bHashes = JSON.parse(page.blurhash);
        }
      } catch (e) {}
        
      r2Keys.forEach((key, idx) => {
        let cleanKey = key;
        if (cleanKey.includes('.mangadex.network/data/')) {
          cleanKey = cleanKey.replace(/https?:\/\/[^\/]+\.mangadex\.network\/data\//, 'https://uploads.mangadex.org/data/');
        }
        const dim = (Array.isArray(dims) && dims[idx]) ? dims[idx] : { width: 800, height: 1200 };
        const bHash = Array.isArray(bHashes) ? bHashes[idx] : (typeof bHashes === 'string' ? bHashes : undefined);
        allSlices.push({
          key: cleanKey,
          width: dim.width || 800,
          height: dim.height || 1200,
          blurhash: bHash
        });
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
        freshness={freshness ?? undefined}
        r2BaseUrl={r2BaseUrl}
        availableLanguages={available_languages || ["en", "es", "fr"]}
        currentLanguage={chapter?.language || "en"}
      />
    );
  } catch (e) {
    notFound();
  }
}
