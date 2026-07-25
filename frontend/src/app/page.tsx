import Link from "next/link";
import { MangaCard } from "@/components/MangaCard";
import { TopBar } from "@/components/TopBar";
import { AddToLibraryButton } from "@/components/AddToLibraryButton";
import { HomeLibraryRow } from "@/components/HomeLibraryRow";
import { PersonalizedFeedRow } from "@/components/PersonalizedFeedRow";
import { ContinueReadingBubble } from "@/components/ContinueReadingBubble";
import { Play, ChevronRight } from "lucide-react";

// Server Component fetching live data from Cloudflare Worker
export const revalidate = 60; // Edge Cache for 60 seconds

export default async function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  
  let mangas: any[] = [];
  try {
    const res = await fetch(`${apiUrl}/api/manga?page=1&limit=20`);
    if (res.ok) {
      const data = await res.json();
      mangas = data.data || [];
    }
  } catch (e) {
    console.error("Failed to fetch mangas:", e);
  }

  // Map API data to the UI format temporarily if it's missing fields
  const uiMangas = mangas.map((m: any) => ({
    slug: m.id,
    title: m.title,
    altTitle: m.alt_title || "",
    description: m.description || "",
    genres: m.genres || ["Action", "Fantasy"],
    latestChapter: m.latest_chapter_number || 1,
    status: m.status || "Ongoing",
    cover_url: m.cover_url,
    coverHue: 250,
    coverHue2: 300,
  }));

  const featured = uiMangas[0] || {
    slug: "fallback", title: "Welcome to Senpai Den", altTitle: "", description: "Loading mangas...", genres: [], latestChapter: 1, status: "Ongoing", coverHue: 250, coverHue2: 300
  };
  const trending = uiMangas.slice(0, 8);
  const updated = uiMangas.slice(8, 16);
  const resume: any[] = []; // History not implemented in DB yet

  return (
    <div className="pb-28 md:pb-8">
      <TopBar transparent />

      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40"
          style={{ background: "#08080C" }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#08080C]/70 to-[#08080C]" />

        <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-10 pt-6 md:px-8 md:pb-16 md:pt-10">
          <div
            className="hidden aspect-[2/3] w-56 shrink-0 rounded-2xl border border-white/10 shadow-2xl md:block bg-[#16161F] overflow-hidden relative"
          >
            {featured.cover_url && (
              <img src={featured.cover_url} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md sd-gradient px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Featured
              </span>
              <span className="text-[11px] uppercase tracking-widest text-[#A1A1AA]">
                {featured.genres.slice(0, 3).join(" · ")}
              </span>
            </div>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">{featured.title}</h1>
            <p className="mt-1 text-sm text-[#A1A1AA]">{featured.altTitle}</p>
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-[#A1A1AA] md:text-base">
              {featured.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/manga/${featured.slug}/1`}
                className="group inline-flex items-center gap-2 rounded-xl sd-gradient px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.7)] transition-transform active:scale-[0.97]"
              >
                <Play className="h-4 w-4 fill-white" />
                Start Reading
              </Link>
              <AddToLibraryButton manga={featured} />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Genres */}
      <section className="mx-auto mt-6 max-w-7xl px-4 md:px-8">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {["Action", "Romance", "Fantasy", "Drama", "Comedy", "Sci-Fi"].map((g) => (
            <Link
              key={g}
              href={`/discover?genre=${encodeURIComponent(g)}`}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#A1A1AA] transition hover:bg-white/10 hover:text-white"
            >
              {g}
            </Link>
          ))}
          <Link
            href="/discover"
            className="shrink-0 rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-2 text-xs font-semibold text-[#8B5CF6] transition hover:bg-[#8B5CF6]/20"
          >
            Explore All ✦
          </Link>
        </div>
      </section>

      {/* Continue Reading (Client Side Library) */}
      <HomeLibraryRow />

      {/* Tier 3 Personalization: Recommended For You */}
      <PersonalizedFeedRow />

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionTitle title="Trending Now" accent="violet" href="/discover" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {trending.map((m) => (
            <MangaCard key={m.slug} manga={m} showChapter />
          ))}
        </div>
      </section>

      {/* Recently Updated */}
      <section className="mx-auto mt-10 max-w-7xl px-4 md:px-8">
        <SectionTitle title="Recently Updated" accent="cyan" />
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          {updated.map((m) => (
            <div key={m.slug} className="w-32 shrink-0 snap-start sm:w-36">
              <MangaCard manga={m} showChapter />
            </div>
          ))}
        </div>
      </section>

      {/* Floating Retention Bubble */}
      <ContinueReadingBubble />
    </div>
  );
}

function SectionTitle({ title, accent, href }: { title: string; accent: "violet" | "cyan"; href?: string }) {
  return (
    <div className="mb-4 mt-8 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold md:text-xl">
        <span
          className="h-4 w-1 rounded-full"
          style={{ background: accent === "violet" ? "#8B5CF6" : "#22D3EE" }}
        />
        {title}
      </h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#A1A1AA] hover:text-white">
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
