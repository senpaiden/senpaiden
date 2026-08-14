"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Database, RefreshCw, Trash2, BookOpen, Layers, CheckCircle2, Flame, Eye, AlertCircle } from "lucide-react";
import { getAllMangaList, deleteMangaSeries, triggerManualScrape } from "@/app/actions";

interface MangaItem {
  id: string;
  source_id: string;
  source_provider: 'mangapill' | 'mangadex';
  title: string;
  description?: string;
  cover_url?: string;
  status?: string;
  view_count: number;
  totalChapters: number;
  readyChapters: number;
  queuedChapters: number;
  failedChapters: number;
  created_at: string;
  updated_at: string;
}

export function MangaCatalogManager() {
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [rescrapeId, setRescrapeId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchManga = useCallback(async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllMangaList(query);
      setMangaList(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch manga catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManga(searchQuery);
  }, [searchQuery, fetchManga]);

  const handleRescrape = async (manga: MangaItem) => {
    setRescrapeId(manga.id);
    setMsg(null);
    setError(null);
    try {
      const res = await triggerManualScrape(manga.title, manga.source_provider || 'mangapill');
      if (res.success) {
        setMsg(`Re-scraped "${manga.title}": Discovered ${res.totalDiscovered} chapters (${res.newlyQueued} newly queued).`);
        fetchManga(searchQuery);
      } else {
        setError(res.error || `Failed to re-scrape "${manga.title}".`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to trigger re-scrape.");
    } finally {
      setRescrapeId(null);
    }
  };

  const handleDelete = async (manga: MangaItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${manga.title}" and all associated chapters?`)) return;

    setDeleteId(manga.id);
    setMsg(null);
    setError(null);
    try {
      const res = await deleteMangaSeries(manga.id);
      if (res.success) {
        setMsg(`Successfully deleted "${manga.title}".`);
        fetchManga(searchQuery);
      } else {
        setError(res.error || `Failed to delete "${manga.title}".`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete manga series.");
    } finally {
      setDeleteId(null);
    }
  };

  // Compute stats across current list
  const totalSeriesCount = mangaList.length;
  const totalChaptersCount = mangaList.reduce((acc, m) => acc + m.totalChapters, 0);
  const totalReadyCount = mangaList.reduce((acc, m) => acc + m.readyChapters, 0);
  const totalQueuedCount = mangaList.reduce((acc, m) => acc + m.queuedChapters, 0);
  const totalFailedCount = mangaList.reduce((acc, m) => acc + m.failedChapters, 0);

  return (
    <div className="space-y-8">
      {/* Header HUD Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-[#E5E0D8] relative overflow-hidden bg-white shadow-md space-y-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-400" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm shrink-0">
              <Database className="w-7 h-7 text-red-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-zinc-900 font-sans tracking-tight">
                  Complete Manga Catalog & Index
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 uppercase">
                  {totalSeriesCount} Series Registered
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Query and inspect every single manga series, chapter state machine distribution, and source provider records in Supabase
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchManga(searchQuery)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-[#F3EFE6] text-zinc-800 font-bold text-xs border border-[#E5E0D8] transition-all cursor-pointer font-sans shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-600" : "text-zinc-600"}`} />
            <span>Sync Live List</span>
          </button>
        </div>

        {/* Telemetry Summary Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8]">
            <span className="text-zinc-500 text-[10px] uppercase block">Total Series</span>
            <strong className="text-zinc-900 text-base font-bold block mt-0.5">{totalSeriesCount}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8]">
            <span className="text-zinc-500 text-[10px] uppercase block">Total Chapters</span>
            <strong className="text-zinc-900 text-base font-bold block mt-0.5">{totalChaptersCount}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8]">
            <span className="text-zinc-500 text-[10px] uppercase block">Ready Slices</span>
            <strong className="text-emerald-600 text-base font-bold block mt-0.5">{totalReadyCount}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8]">
            <span className="text-zinc-500 text-[10px] uppercase block">Queued Processing</span>
            <strong className="text-red-600 text-base font-bold block mt-0.5">{totalQueuedCount}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8]">
            <span className="text-zinc-500 text-[10px] uppercase block">Failed Jobs</span>
            <strong className="text-red-700 text-base font-bold block mt-0.5">{totalFailedCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Query manga catalog by title (e.g. One Piece, Wind Breaker)..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs font-mono bg-white border-[#E5E0D8] text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 shadow-sm"
          />
        </div>

        <div className="text-xs font-mono text-zinc-600">
          Showing <strong className="text-zinc-900 font-bold">{mangaList.length}</strong> matching entries
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Catalog Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-[#E5E0D8] bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-600 uppercase font-mono bg-[#F3EFE6] border-b border-[#E5E0D8]">
              <tr>
                <th className="px-6 py-4 font-bold">Manga Title & Source</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Chapter Distribution</th>
                <th className="px-6 py-4 font-bold">Views</th>
                <th className="px-6 py-4 font-bold">Last Synced</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8] font-mono">
              {mangaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-red-600 opacity-80 animate-pulse" />
                    <p className="font-extrabold text-base text-zinc-900 font-sans">No Manga Found in Database</p>
                    <p className="text-xs text-zinc-500 mt-1">Try broadening your search query or trigger a mass scrape batch.</p>
                  </td>
                </tr>
              ) : (
                mangaList.map((manga) => (
                  <tr key={manga.id} className="hover:bg-[#F9F7F2] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {manga.cover_url ? (
                          <img
                            src={manga.cover_url}
                            alt={manga.title}
                            className="w-10 h-14 rounded-lg object-cover border border-[#E5E0D8] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-14 rounded-lg bg-[#F3EFE6] border border-[#E5E0D8] flex items-center justify-center text-zinc-500 text-[10px] font-mono shrink-0">
                            NO COVER
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-zinc-900 font-sans text-sm group-hover:text-red-600 transition-colors">
                            {manga.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-100 border border-red-200 text-red-700 uppercase">
                              {manga.source_provider || 'mangapill'}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]" title={manga.source_id}>
                              ID: {manga.source_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F3EFE6] border border-[#E5E0D8] text-zinc-700 uppercase">
                        {manga.status || 'ongoing'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-zinc-900">
                          <span className="font-bold text-sm">{manga.totalChapters}</span>
                          <span className="text-zinc-500 text-[10px]">Total Ch</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-emerald-700 font-bold">{manga.readyChapters} Ready</span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-red-600 font-bold">{manga.queuedChapters} Queued</span>
                          {manga.failedChapters > 0 && (
                            <>
                              <span className="text-zinc-400">•</span>
                              <span className="text-red-700 font-bold">{manga.failedChapters} Failed</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-zinc-700">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{manga.view_count.toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-zinc-500 font-mono">
                      {new Date(manga.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRescrape(manga)}
                          disabled={rescrapeId === manga.id}
                          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F3EFE6] text-zinc-800 font-bold text-xs border border-[#E5E0D8] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Re-scrape and discover new chapters"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${rescrapeId === manga.id ? "animate-spin text-red-600" : "text-zinc-600"}`} />
                          <span className="hidden sm:inline">Sync</span>
                        </button>

                        <button
                          onClick={() => handleDelete(manga)}
                          disabled={deleteId === manga.id}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs border border-red-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Delete manga and associated chapters"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${deleteId === manga.id ? "animate-spin" : ""}`} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
