"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { MangaCard } from "@/components/MangaCard";
import { History as HistoryIcon, Trash2 } from "lucide-react";
import type { Manga } from "@/lib/manga-data";

interface HistoryItem {
  manga: Manga;
  lastChapter: number;
  lastReadTime?: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadHistory = () => {
    try {
      const items: HistoryItem[] = [];
      const keys = Object.keys(localStorage);

      // Find all senpai_progress_* keys
      for (const key of keys) {
        if (key.startsWith("senpai_progress_")) {
          const mangaId = key.replace("senpai_progress_", "");
          const rawProgress = localStorage.getItem(key);
          if (!rawProgress) continue;

          const progress = JSON.parse(rawProgress);
          const chapterNum = parseFloat(progress.chapterNumber || "1");

          // Try to look up manga metadata from senpai_library or mock fallback
          const libraryStr = localStorage.getItem("senpai_library");
          let mangaMeta: Manga | null = null;
          if (libraryStr) {
            const library: Manga[] = JSON.parse(libraryStr);
            mangaMeta = library.find((m) => m.slug === mangaId) || null;
          }

          if (!mangaMeta) {
            mangaMeta = {
              slug: mangaId,
              title: progress.title || `Manga (${mangaId.slice(0, 8)})`,
              altTitle: "",
              description: "",
              genres: ["Action"],
              status: "Ongoing",
              coverHue: 250,
              coverHue2: 300,
              latestChapter: chapterNum,
            };
          }

          items.push({
            manga: {
              ...mangaMeta,
              latestChapter: chapterNum,
            },
            lastChapter: chapterNum,
            lastReadTime: progress.timestamp || Date.now(),
          });
        }
      }

      // Sort by most recently read
      items.sort((a, b) => (b.lastReadTime || 0) - (a.lastReadTime || 0));
      setHistory(items);
    } catch (e) {
      setHistory([]);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear reading history?")) {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith("senpai_progress_") || key.startsWith("senpai_read_chapters_")) {
          localStorage.removeItem(key);
        }
      }
      setHistory([]);
    }
  };

  return (
    <div className="pb-28 md:pb-8">
      <TopBar />
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8 md:pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black md:text-3xl">History</h1>
            <p className="mt-1 text-sm text-[#A1A1AA]">Your recently read manga series.</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear History
            </button>
          )}
        </div>

        {!isLoaded ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl sd-shimmer" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white/5 text-[#A1A1AA]">
              <HistoryIcon className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-white">No history yet</h2>
            <p className="mt-2 max-w-sm text-sm text-[#A1A1AA]">
              Start reading some manga and your history will appear here, saved locally to your device.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {history.map((item) => (
              <MangaCard key={item.manga.slug} manga={item.manga} showChapter />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
