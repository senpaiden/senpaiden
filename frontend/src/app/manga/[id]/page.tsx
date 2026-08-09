import { notFound } from "next/navigation";
import { MangaDetailClient } from "./MangaDetailClient";
import { AdSlot } from "@/components/AdSlot";
import { getLocalCatalogue, type CatalogueManga } from "@/lib/local-catalogue";

export const revalidate = 60; // Edge Cache

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  
  try {
    const res = await fetch(`${apiUrl}/api/manga/${resolvedParams.id}`, { signal: AbortSignal.timeout(2500), next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      return {
        title: `${data.title} — Senpai Den`,
        description: data.description,
      };
    }
  } catch {}
  return { title: "Manga — Senpai Den" };
}

export default async function MangaDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  
  let manga: CatalogueManga | null = null;
  let chapters: Record<string, unknown>[] = [];
  let related: CatalogueManga[] = [];
  
  try {
    const res = await fetch(`${apiUrl}/api/manga/${resolvedParams.id}`, { signal: AbortSignal.timeout(2500), next: { revalidate: 60 } });
    if (res.ok) { const data = await res.json(); manga = data as CatalogueManga; chapters = (data.chapters || []) as Record<string, unknown>[]; }
  } catch {}

  if (!manga) {
    const local = await getLocalCatalogue();
    const match = local.find((item) => item.id === resolvedParams.id);
    if (!match) notFound();
    manga = match;
    chapters = [];
    related = local.filter((item) => item.id !== resolvedParams.id).slice(0, 4);
  }

  try {
    // Fetch related mangas using recommendations endpoint with fallback
    const recRes = await fetch(`${apiUrl}/api/manga/${resolvedParams.id}/co-binged`, { signal: AbortSignal.timeout(1800), next: { revalidate: 3600 } });
    if (recRes.ok) {
      const recData = await recRes.json();
      related = recData.data || [];
    }
    if (!related || related.length === 0) {
      const relatedRes = await fetch(`${apiUrl}/api/manga?page=1&limit=6`, { signal: AbortSignal.timeout(1800), next: { revalidate: 60 } });
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        related = ((relatedData.data || []) as CatalogueManga[]).filter((item) => item.id !== manga?.id).slice(0, 4);
      }
    }
  } catch {}

  return <><MangaDetailClient manga={manga} chapters={chapters} related={related} /><div className="mx-auto max-w-6xl px-4 pb-10 md:px-8"><AdSlot placement="manga-detail" /></div></>;
}
