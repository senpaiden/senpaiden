"use client";

import { useState } from "react";
import { Search, Sparkles, AlertCircle, CheckCircle2, Flame, Terminal, ArrowUpRight } from "lucide-react";
import { triggerManualScrape } from "@/app/actions";

interface ManualScraperControlProps {
  popularManga?: Array<{ id: string; title: string }>;
}

export function ManualScraperControl({ popularManga = [] }: ManualScraperControlProps) {
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState<'mangapill' | 'mangadex'>('mangapill');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamic presets derived directly from Supabase database records
  const dbTitles = popularManga.map((m) => m.title).filter(Boolean);
  const PRESETS = Array.from(new Set(dbTitles));

  const handleScrape = async (targetTitle?: string) => {
    const query = targetTitle || title;
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await triggerManualScrape(query, provider);
      if (res.success) {
        setResult(res);
        if (!targetTitle) setTitle("");
      } else {
        setError(res.error || "Ingestion Failed: Unable to discover or queue series chapters.");
      }
    } catch {
      setError("Network Exception: Scraper service endpoint timed out or failed to parse source HTML/API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Primary Scraper Control Panel */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-8 border border-[#E5E0D8] relative overflow-hidden bg-white shadow-md">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-400" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm shrink-0">
              <Sparkles className="w-7 h-7 text-red-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-zinc-900 font-sans tracking-tight">
                Manual Scraper & Ingestion Control
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Trigger instant on-demand chapter discovery & queueing from MangaPill (HTML Scraper) or MangaDex (Official API)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>SCRAPER ONLINE</span>
          </div>
        </div>

        {/* Dynamic Catalog & Ingestion Presets from DB */}
        {PRESETS.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 font-mono font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-red-600 animate-bounce" />
                Live Catalog Ingestion Targets:
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Click to re-scrape & queue chapters</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setTitle(preset);
                    handleScrape(preset);
                  }}
                  disabled={loading}
                  className="px-4 py-2 rounded-2xl bg-white hover:bg-[#F3EFE6] border border-[#E5E0D8] text-xs font-mono font-semibold text-zinc-800 transition-all disabled:opacity-50 flex items-center gap-1.5 hover:border-red-400 cursor-pointer active:scale-95 shadow-sm"
                >
                  <span className="text-red-600 font-bold">+</span>
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-mono text-zinc-600 uppercase tracking-wider block">
              Manga Series Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter exact manga title (e.g. One Piece, Solo Leveling)..."
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl glass-input text-xs font-mono border-[#E5E0D8] bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-600 uppercase tracking-wider block">
              Source Provider Engine
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="w-full py-3.5 px-4 rounded-2xl glass-input text-xs font-mono font-semibold cursor-pointer border border-[#E5E0D8] bg-white text-zinc-900 shadow-sm"
            >
              <option value="mangapill" className="bg-white text-zinc-900">MangaPill Scraper (Fast HTML)</option>
              <option value="mangadex" className="bg-white text-zinc-900">MangaDex Official API (JSON)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <button
            onClick={() => handleScrape()}
            disabled={loading || !title.trim()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 font-sans"
          >
            {loading ? (
              <span className="flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 animate-spin text-white" />
                INGESTING SERIES & DISCOVERING CHAPTERS...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>DISPATCH MANUAL SCRAPE</span>
              </>
            )}
          </button>
        </div>

        {/* Result Notification Card */}
        {result && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 font-mono">
            <div className="flex items-center gap-2.5 text-emerald-900 font-extrabold text-sm font-sans">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Ingestion Complete: "{result.mangaTitle}"</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Discovered <strong className="text-zinc-900">{result.totalDiscovered}</strong> chapters.
              Successfully queued <strong className="text-emerald-700">{result.newlyQueued}</strong> new chapters into Supabase background processing queue.
            </p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
