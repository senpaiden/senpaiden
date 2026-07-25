"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, Check, Minus } from "lucide-react";

interface Genre {
  name: string;
  slug: string;
}

export function AdvancedFilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  
  // State maps: genreName -> state (1 = include, 2 = exclude)
  const [filterState, setFilterState] = useState<Record<string, 1 | 2>>({});

  useEffect(() => {
    // Fetch dynamic genres from API
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/genres`)
      .then(res => res.json())
      .then(data => {
        if (data.genres) setGenres(data.genres);
      })
      .catch(e => console.error("Failed to load genres:", e));
  }, []);

  // Sync initial state from URL query params
  useEffect(() => {
    const included = searchParams.get('included')?.split(',') || [];
    const excluded = searchParams.get('excluded')?.split(',') || [];
    const singleGenre = searchParams.get('genre');

    const newState: Record<string, 1 | 2> = {};
    if (singleGenre) newState[singleGenre] = 1;
    included.forEach(g => { if (g) newState[g] = 1; });
    excluded.forEach(g => { if (g) newState[g] = 2; });

    setFilterState(newState);
  }, [searchParams]);

  const toggleGenre = (genreName: string) => {
    setFilterState(prev => {
      const current = prev[genreName];
      const next = { ...prev };
      
      if (!current) next[genreName] = 1;      // Unselected -> Include (1)
      else if (current === 1) next[genreName] = 2; // Include -> Exclude (2)
      else delete next[genreName];            // Exclude -> Unselected

      return next;
    });
  };

  const applyFilters = () => {
    const included = Object.keys(filterState).filter(k => filterState[k] === 1);
    const excluded = Object.keys(filterState).filter(k => filterState[k] === 2);

    const params = new URLSearchParams();
    if (included.length > 0) params.set("included", included.join(","));
    if (excluded.length > 0) params.set("excluded", excluded.join(","));

    router.push(`/discover?${params.toString()}`);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilterState({});
    router.push("/discover");
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="shrink-0 flex items-center gap-2 rounded-xl border border-white/10 bg-[#16161F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1C1C27] hover:border-[#8B5CF6]/40"
      >
        <Filter className="h-4 w-4 text-[#8B5CF6]" />
        Advanced Filters
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#08080C] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Filter Genres</h2>
              <button onClick={() => setIsOpen(false)} className="text-[#A1A1AA] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 text-xs text-[#A1A1AA] flex items-center gap-4">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center"><Check className="w-2 h-2 text-emerald-500" /></div> Include</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/50 flex items-center justify-center"><X className="w-2 h-2 text-red-500" /></div> Exclude</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" /> Neutral</span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto no-scrollbar pb-4">
              {genres.map(g => {
                const state = filterState[g.name];
                let btnClass = "border-white/10 bg-white/5 text-[#A1A1AA]";
                let Icon = null;

                if (state === 1) {
                  btnClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
                  Icon = Check;
                } else if (state === 2) {
                  btnClass = "border-red-500/50 bg-red-500/10 text-red-400";
                  Icon = Minus;
                }

                return (
                  <button
                    key={g.slug}
                    onClick={() => toggleGenre(g.name)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition select-none ${btnClass}`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {g.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
              <button 
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-semibold text-[#A1A1AA] hover:text-white"
              >
                Clear
              </button>
              <button 
                onClick={applyFilters}
                className="rounded-xl sd-gradient px-6 py-2 text-sm font-bold text-white shadow-lg active:scale-95 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
