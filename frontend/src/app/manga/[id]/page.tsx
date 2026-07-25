import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { ChevronLeft, Play, Share2 } from "lucide-react";
import { AddToLibraryButton } from "@/components/AddToLibraryButton";
import { ChapterList } from "./ChapterList";
import { RecommendationsRow } from "@/components/RecommendationsRow";
import { notFound } from "next/navigation";

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
  
  try {
    const res = await fetch(`${apiUrl}/api/manga/${resolvedParams.id}`);
    if (!res.ok) notFound();
    const data = await res.json();
    manga = data;
    chapters = data.chapters || [];
  } catch (e) {
    notFound();
  }

  // Fallbacks for UI that database might not have yet
  const genres = manga.genres || ["Action", "Fantasy"];
  const startChapter = chapters.length > 0 ? Math.min(...chapters.map((c: any) => c.chapter_number)) : 1;

  // Fake hue for procedural cover (until we store it in DB)
  const coverHue = 250;
  const coverHue2 = 300;
  const coverGradient = `linear-gradient(135deg, oklch(0.4 0.15 ${coverHue}) 0%, oklch(0.2 0.1 ${coverHue2}) 100%)`;

  return (
    <div className="pb-28 md:pb-8">
      <TopBar transparent />

      {/* Blurred background */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[420px] opacity-40 blur-3xl"
        style={{ background: coverGradient }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-transparent via-[#08080C]/70 to-[#08080C]" />

      <div className="mx-auto max-w-5xl px-4 pt-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-4 flex flex-col gap-5 md:flex-row md:gap-8">
          <div
            className="relative aspect-[2/3] w-40 shrink-0 self-center rounded-2xl border border-white/10 shadow-2xl md:w-56 md:self-start bg-[#16161F] overflow-hidden"
          >
            {manga.cover_url && (
              <img src={manga.cover_url} alt={manga.title} className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {genres.map((g: string) => (
                <span key={g} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-[#A1A1AA]">
                  {g}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-black leading-tight md:text-4xl">{manga.title}</h1>
            <p className="mt-1 text-sm text-[#A1A1AA]">{manga.alt_title}</p>
            <div className="mt-2 text-xs text-[#71717A]">
              by <span className="text-white">Unknown</span> · {manga.status}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA] md:text-base">{manga.description}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/manga/${manga.id}/${startChapter}`}
                className="inline-flex items-center gap-2 rounded-xl sd-gradient px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.7)] active:scale-[0.97]"
              >
                <Play className="h-4 w-4 fill-white" />
                Start Reading
              </Link>
              <AddToLibraryButton manga={{
                slug: manga.id,
                title: manga.title,
                altTitle: manga.alt_title || "",
                description: manga.description || "",
                genres: genres,
                status: manga.status || "Ongoing",
                cover_url: manga.cover_url,
                coverHue: 250,
                coverHue2: 300,
                latestChapter: startChapter
              }} />
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#A1A1AA]">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Client Component for Chapter List Sorting/Searching */}
        <ChapterList mangaId={manga.id} initialChapters={chapters} />

        {/* Tier 1 Recommendation: More Like This */}
        <RecommendationsRow mangaId={manga.id} type="semantic" />
      </div>
    </div>
  );
}
