import { notFound } from "next/navigation";
import { MangaDetailClient } from "./MangaDetailClient";

export const revalidate = 60; // Edge Cache

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  
  try {
    const res = await fetch(`${apiUrl}/api/manga/${resolvedParams.id}`);
    if (res.ok) {
      const data = await res.json();
      return {
        title: `${data.title} — Senpai Den`,
        description: data.description,
      };
    }
  } catch (e) {}
  return { title: "Manga — Senpai Den" };
}

export default async function MangaDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  
  let manga: any = null;
  let chapters: any[] = [];
  let related: any[] = [];
  
  try {
    const res = await fetch(`${apiUrl}/api/manga/${resolvedParams.id}`);
    if (!res.ok) notFound();
    const data = await res.json();
    manga = data;
    chapters = data.chapters || [];
  } catch (e) {
    notFound();
  }

  try {
    // Fetch related mangas (mocking by fetching first page)
    const relatedRes = await fetch(`${apiUrl}/api/manga?page=1&limit=5`);
    if (relatedRes.ok) {
       const relatedData = await relatedRes.json();
       related = relatedData.data.filter((m: any) => m.id !== manga.id).slice(0, 4);
    }
  } catch(e) {}

  return (
    <MangaDetailClient manga={manga} chapters={chapters} related={related} />
  );
}
