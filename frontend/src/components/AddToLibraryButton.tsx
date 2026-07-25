"use client";

import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { Manga } from "@/lib/manga-data";

export function AddToLibraryButton({ manga }: { manga: Manga }) {
  const [inLibrary, setInLibrary] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("senpai_library");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.some((m: Manga) => m.slug === manga.slug)) {
          setInLibrary(true);
        }
      }
    } catch (e) {}
  }, [manga.slug]);

  const toggleLibrary = () => {
    try {
      const saved = localStorage.getItem("senpai_library");
      let library: Manga[] = saved ? JSON.parse(saved) : [];
      
      if (inLibrary) {
        library = library.filter((m) => m.slug !== manga.slug);
      } else {
        library.push(manga);
      }
      
      localStorage.setItem("senpai_library", JSON.stringify(library));
      setInLibrary(!inLibrary);
      window.dispatchEvent(new CustomEvent("senpai_library_updated"));
    } catch (e) {}
  };

  return (
    <button 
      onClick={toggleLibrary}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        inLibrary 
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" 
          : "border-[#22D3EE]/40 bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/15"
      }`}
    >
      {inLibrary ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {inLibrary ? "In Library" : "Add to Library"}
    </button>
  );
}
