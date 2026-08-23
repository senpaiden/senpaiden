"use client";

import { useEffect, useState } from "react";
import { MangaCard } from "./MangaCard";
import type { Manga } from "@/lib/manga-data";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function HomeLibraryRow() {
  const [library, setLibrary] = useState<Manga[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("senpai_library");
      if (saved) {
        setLibrary(JSON.parse(saved));
      }
    } catch {}
  }, []);

  if (!mounted || library.length === 0) return null;

  return (
    <section className="mx-auto mt-10 max-w-7xl px-4 md:px-8">
      <div className="mb-4 mt-8 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold md:text-xl">
          <span className="h-4 w-1 rounded-full bg-emerald-500" />
          Continue Reading
        </h2>
        <Link href="/library" className="inline-flex items-center gap-1 text-xs font-semibold text-[#A1A1AA] hover:text-white">
          Your Library <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {library.map((m) => (
          <div key={m.slug} className="w-32 shrink-0 snap-start sm:w-36">
            <MangaCard manga={m} />
          </div>
        ))}
      </div>
    </section>
  );
}
