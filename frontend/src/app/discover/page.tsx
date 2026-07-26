"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Search, SlidersHorizontal, Star, Bookmark, ChevronDown, X, Filter } from "lucide-react";
import { NewMangaCard } from "@/components/NewMangaCard";

const TYPES = ["All", "Manga", "Manhwa", "Manhua"];
const STATUSES = ["All", "Ongoing", "Completed", "Hiatus"];
const SORT_OPTIONS = ["Popularity", "Rating", "Latest", "A-Z", "Chapters"];

const GENRES_DATA = [
  { name: "Action", emoji: "⚔️", color: "#FF2E2E" },
  { name: "Romance", emoji: "💕", color: "#EC4899" },
  { name: "Fantasy", emoji: "✨", color: "#8B5CF6" },
  { name: "Comedy", emoji: "😂", color: "#F59E0B" },
  { name: "Horror", emoji: "👻", color: "#10B981" },
  { name: "Sci-Fi", emoji: "🚀", color: "#3B82F6" },
  { name: "Drama", emoji: "🎭", color: "#9333EA" },
  { name: "Slice of Life", emoji: "☕", color: "#EAB308" }
];

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const initialGenre = searchParams.get("genre");
  const [genreFilter, setGenreFilter] = useState<string[]>(initialGenre ? [initialGenre] : []);
  
  const initialSort = searchParams.get("sort");
  const [sortBy, setSortBy] = useState(initialSort === "updated" ? "Latest" : "Popularity");
  
  const [showFilters, setShowFilters] = useState(false);
  
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
      try {
        const res = await fetch(`${apiUrl}/api/manga?page=1&limit=50`);
        if (res.ok) {
          const data = await res.json();
          // Map to match UI shape
          const mapped = (data.data || []).map((m: any) => ({
            id: m.id,
            slug: m.id,
            title: m.title,
            author: m.author || "Unknown",
            genres: m.genres || ["Action"],
            latest_chapter_number: m.latest_chapter_number || 1,
            status: m.status || "Ongoing",
            cover: m.cover_url,
            cover_url: m.cover_url,
            type: m.type || "Manga",
            rating: m.rating || 4.8,
            isNew: Math.random() > 0.8
          }));
          setMangas(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = [...mangas];
    if (query) list = list.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()) || m.author.toLowerCase().includes(query.toLowerCase()));
    if (typeFilter !== "All") list = list.filter((m) => m.type === typeFilter);
    if (statusFilter !== "All") list = list.filter((m) => m.status === statusFilter);
    if (genreFilter.length) list = list.filter((m) => genreFilter.every((g) => m.genres.includes(g)));
    
    if (sortBy === "Rating") list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "Latest") list.sort((a, b) => b.latest_chapter_number - a.latest_chapter_number);
    else if (sortBy === "A-Z") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "Chapters") list.sort((a, b) => b.latest_chapter_number - a.latest_chapter_number);
    return list;
  }, [mangas, query, typeFilter, statusFilter, genreFilter, sortBy]);

  const toggleGenre = (g: string) =>
    setGenreFilter((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  return (
    <div className="min-h-screen text-foreground pb-20 md:pb-8">
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-6 border-b border-primary/10">
        <h1 className="text-3xl font-black mb-1 text-white font-rajdhani">
          Explore <span className="text-primary">Manga</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Discover your next obsession from 10,000+ titles</p>

        {/* Search + controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 max-w-xl relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or genre..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground transition-colors bg-white/5 border border-primary/15 focus:border-primary/50 font-noto"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border flex-1 md:flex-none ${showFilters ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white'}`}
            >
              <SlidersHorizontal size={15} /> Filters {genreFilter.length > 0 && `(${genreFilter.length})`}
            </button>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="py-2.5 rounded-xl text-sm outline-none cursor-pointer bg-transparent text-white font-exo border-none"
              >
                {SORT_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#161B22]">{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Type + Status pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4 overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-2 shrink-0">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === t ? 'bg-primary text-white shadow-[0_0_10px_rgba(255,46,46,0.35)]' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-white/10 hidden sm:block shrink-0" />
          <div className="flex gap-2 shrink-0">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${statusFilter === s ? 'bg-primary/15 text-primary border-primary/35' : 'bg-transparent text-muted-foreground border-transparent hover:bg-white/5'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Genre filter panel */}
        {showFilters && (
          <div className="mt-4 p-4 rounded-2xl bg-[#161B22]/90 border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={13} className="text-primary" />
              <span className="text-xs font-bold text-white">Filter by Genre</span>
              {genreFilter.length > 0 && (
                <button onClick={() => setGenreFilter([])} className="text-[10px] text-muted-foreground hover:text-white ml-2">Clear all</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {GENRES_DATA.map((g) => {
                const active = genreFilter.includes(g.name);
                return (
                  <button key={g.name} onClick={() => toggleGenre(g.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${active ? 'bg-red-500/10 border-red-500/30 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                  >
                    <span>{g.emoji}</span> {g.name}
                    {active && <X size={10} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-muted-foreground">
            Showing <span className="text-white font-bold">{filtered.length}</span> results
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-jetbrains">Loading latest series...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-black text-white mb-2 font-rajdhani">No results found</h3>
            <p className="text-muted-foreground text-sm">Try different keywords or remove filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {filtered.map((m, i) => (
              <NewMangaCard key={m.id} manga={m} idx={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-jetbrains">Loading...</div>}>
      <ExplorePageContent />
    </Suspense>
  );
}
