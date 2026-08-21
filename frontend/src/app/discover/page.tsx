import { fetchApi } from "@/lib/api-client";
import Link from "next/link";
import { MangaCard } from "@/components/MangaCard";
import { AdvancedFilterPanel } from "@/components/AdvancedFilterPanel";
import { AdSlot } from "@/components/AdSlot";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalCatalogue, type CatalogueManga } from "@/lib/local-catalogue";

export const revalidate = 60; // Edge Cache

export const metadata = {
  title: "Discover Manga, Manhwa & Webtoons",
  description: "Discover trending manga, manhwa, and webtoons curated for your next binge on Senpai Den.",
  alternates: { canonical: "/discover" },
};

export default async function Discover({ searchParams }: { searchParams: Promise<{ genre?: string; page?: string; included?: string; excluded?: string; sort?: string }> }) {
  const resolvedParams = await searchParams;
  const currentGenre = resolvedParams.genre || "All";
  const pageNum = parseInt(resolvedParams.page || "1", 10);
  const included = resolvedParams.included;
  const excluded = resolvedParams.excluded;
  const sort = resolvedParams.sort;
  const limit = 24;
  
  let mangas: CatalogueManga[] = [];
  let totalCount = 0;

  try {
    const params = new URLSearchParams();
    params.set("page", pageNum.toString());
    params.set("limit", limit.toString());
    
    if (currentGenre !== "All" && !included) {
      params.set("genre", currentGenre);
    }
    if (included) params.set("included", included);
    if (excluded) params.set("excluded", excluded);
    if (sort) params.set("sort", sort);
      
    const data = await fetchApi<{ data?: CatalogueManga[]; total?: number }>(`/api/manga?${params.toString()}`);
    if (data) {
      mangas = (data.data || []) as CatalogueManga[];
      totalCount = data.total || mangas.length;
    }
  } catch {
    // Keep navigation responsive when the catalogue API is unavailable.
  }
  if (!mangas.length) {
    const local = await getLocalCatalogue();
    const genreMatches = currentGenre === "All" ? local : local.filter((manga) => manga.genres.some((genre) => genre.toLowerCase() === currentGenre.toLowerCase()));
    const filtered = genreMatches.length ? genreMatches : local;
    totalCount = filtered.length;
    mangas = filtered.slice((pageNum - 1) * limit, pageNum * limit);
  }

  const uiMangas = mangas.map((m) => ({
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

  const POPULAR_GENRES = ["Action", "Romance", "Fantasy", "Drama", "Comedy", "Sci-Fi", "Slice of Life", "Mystery", "Horror"];

  const buildUrl = (targetPage: number, genre: string) => {
    const params = new URLSearchParams();
    if (genre !== "All") params.set("genre", genre);
    if (targetPage > 1) params.set("page", targetPage.toString());
    if (sort) params.set("sort", sort);
    const str = params.toString();
    return `/discover${str ? `?${str}` : ""}`;
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const isLatest = sort === "updated";

  return (
    <div className="pb-28 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8 md:pt-8">
        <h1 className="text-2xl font-black md:text-3xl">{isLatest ? "Latest Releases" : (currentGenre !== "All" ? `${currentGenre} Manga` : "Discover Manga")}</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">{isLatest ? "Manga with recently updated chapters." : "Handpicked worlds waiting inside the Den."}</p>

        {/* Genre Filters */}
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1 items-center">
          <AdvancedFilterPanel />
          <div className="h-6 w-px bg-white/10 mx-1 shrink-0" />
          
          {["All", ...POPULAR_GENRES].map((g) => {
            const isActive = g === currentGenre;
            return (
              <Link
                key={g}
                href={buildUrl(1, g)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "sd-gradient border-transparent text-white"
                    : "border-white/10 bg-white/5 text-[#A1A1AA] hover:text-white"
                }`}
              >
                {g}
              </Link>
            );
          })}
        </div>

        {/* Manga Cards Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {uiMangas.map((m) => (
            <MangaCard key={m.slug} manga={m} showChapter />
          ))}
        </div>

        <div className="mt-8"><AdSlot placement="discover-grid" /></div>

        {/* Pagination Controls */}
        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-xs text-[#A1A1AA]">
            Page <span className="font-bold text-white">{pageNum}</span> of <span className="font-bold text-white">{totalPages}</span>
          </p>

          <div className="flex gap-2">
            {pageNum > 1 ? (
              <Link
                href={buildUrl(pageNum - 1, currentGenre)}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-1 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold text-[#71717A] opacity-50 cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
            )}

            {uiMangas.length === limit ? (
              <Link
                href={buildUrl(pageNum + 1, currentGenre)}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-1 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold text-[#71717A] opacity-50 cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-white/5 pt-8"><AdSlot placement="discover-bottom" /></div>
      </div>
    </div>
  );
}
