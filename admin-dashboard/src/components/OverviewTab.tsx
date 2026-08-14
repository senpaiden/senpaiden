"use client";

import {
  BookOpen,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  TrendingUp,
  Eye,
  ShieldAlert,
  Server,
  Zap,
  ArrowRight,
  Database
} from "lucide-react";

interface OverviewTabProps {
  metrics: {
    statusCounts: Record<string, number>;
    mangaCount: number;
    pageCount: number;
    dlqCount: number;
    popularManga: Array<{ id: string; title: string; view_count: number; cover_url?: string; status: string; source_provider: string }>;
    recentErrors: Array<{ id: string; provider: string; error_type: string; error_detail: string; created_at: string }>;
  };
  onSwitchTab: (tab: string) => void;
}

export function OverviewTab({ metrics, onSwitchTab }: OverviewTabProps) {
  const { statusCounts, mangaCount, pageCount, dlqCount, popularManga, recentErrors } = metrics;

  const totalChapters = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const getPercent = (count: number) => {
    if (!totalChapters) return 0;
    return Math.round((count / totalChapters) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Primary KPI Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Manga Catalog */}
        <div className="glass-panel p-5 rounded-3xl border-l-4 border-l-red-600 glass-card-hover relative overflow-hidden group bg-white shadow-sm">
          <div className="flex items-center justify-between text-red-600 mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">Manga Catalog</span>
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">{mangaCount.toLocaleString()}</p>
          <p className="text-[11px] font-mono text-zinc-500 mt-1 flex items-center gap-1">
            <Database className="w-3 h-3 text-red-600" /> Active Series
          </p>
        </div>

        {/* Queued Chapters */}
        <div className="glass-panel p-5 rounded-3xl border-l-4 border-l-amber-500 glass-card-hover relative overflow-hidden group bg-white shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">Queued Jobs</span>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-4 h-4 text-amber-600 animate-spin-slow" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">{(statusCounts.QUEUED || 0).toLocaleString()}</p>
          <p className="text-[11px] font-mono text-zinc-500 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-600" /> Pending Worker
          </p>
        </div>

        {/* Ready Chapters */}
        <div className="glass-panel p-5 rounded-3xl border-l-4 border-l-emerald-600 glass-card-hover relative overflow-hidden group bg-white shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">Ready Served</span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">{(statusCounts.READY || 0).toLocaleString()}</p>
          <p className="text-[11px] font-mono text-zinc-500 mt-1 flex items-center gap-1">
            <span>{getPercent(statusCounts.READY || 0)}% of total</span>
          </p>
        </div>

        {/* Failed Jobs */}
        <div className="glass-panel p-5 rounded-3xl border-l-4 border-l-red-600 glass-card-hover relative overflow-hidden group bg-white shadow-sm">
          <div className="flex items-center justify-between text-red-600 mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">Job Failures</span>
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 group-hover:scale-110 transition-transform">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">{(statusCounts.FAILED || 0).toLocaleString()}</p>
          <p className="text-[11px] font-mono text-red-600 mt-1 flex items-center gap-1">
            <span>{getPercent(statusCounts.FAILED || 0)}% error rate</span>
          </p>
        </div>

        {/* DLQ Unresolved */}
        <div 
          onClick={() => onSwitchTab('dlq')}
          className="glass-panel p-5 rounded-3xl border-l-4 border-l-red-600 glass-card-hover cursor-pointer relative overflow-hidden group bg-white shadow-sm border-red-200 hover:border-red-500"
        >
          <div className="flex items-center justify-between text-red-600 mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">DLQ Queue</span>
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">{dlqCount.toLocaleString()}</p>
          <p className="text-[11px] font-mono text-red-600 mt-1 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Manage DLQ</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* Page Slices (R2) */}
        <div className="glass-panel p-5 rounded-3xl border-l-4 border-l-zinc-500 glass-card-hover relative overflow-hidden group bg-white shadow-sm">
          <div className="flex items-center justify-between text-zinc-700 mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">WebP Slices</span>
            <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4 text-zinc-700" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">{pageCount.toLocaleString()}</p>
          <p className="text-[11px] font-mono text-zinc-500 mt-1 flex items-center gap-1">
            <Server className="w-3 h-3 text-zinc-600" /> Cloudflare R2
          </p>
        </div>
      </div>

      {/* Chapter Ingestion Pipeline State Machine Visualizer */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 border border-[#E5E0D8] relative overflow-hidden bg-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-red-600 animate-pulse" />
              <h3 className="font-extrabold text-lg text-zinc-900 tracking-tight font-sans">
                Chapter Ingestion State Machine
              </h3>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              Real-time chapter record telemetry across processing pipeline states ({totalChapters.toLocaleString()} total chapters)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
              QUEUED: {(statusCounts.QUEUED || 0).toLocaleString()}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold">
              PROCESSING: {(statusCounts.PROCESSING || 0).toLocaleString()}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
              READY: {(statusCounts.READY || 0).toLocaleString()}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-800 font-semibold">
              FAILED: {(statusCounts.FAILED || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* State Machine Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-[#FAF8F5] rounded-full overflow-hidden flex gap-1 p-1 border border-[#E5E0D8] shadow-inner">
            <div 
              className="h-full bg-amber-400 rounded-full transition-all duration-700" 
              style={{ width: `${getPercent(statusCounts.QUEUED || 0)}%` }}
              title={`Queued: ${statusCounts.QUEUED || 0}`}
            />
            <div 
              className="h-full bg-blue-400 rounded-full transition-all duration-700" 
              style={{ width: `${getPercent(statusCounts.PROCESSING || 0)}%` }}
              title={`Processing: ${statusCounts.PROCESSING || 0}`}
            />
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-700" 
              style={{ width: `${getPercent(statusCounts.READY || 0)}%` }}
              title={`Ready: ${statusCounts.READY || 0}`}
            />
            <div 
              className="h-full bg-orange-400 rounded-full transition-all duration-700" 
              style={{ width: `${getPercent(statusCounts.STALE_RETRY || 0)}%` }}
              title={`Stale Retry: ${statusCounts.STALE_RETRY || 0}`}
            />
            <div 
              className="h-full bg-red-600 rounded-full transition-all duration-700" 
              style={{ width: `${getPercent(statusCounts.FAILED || 0)}%` }}
              title={`Failed: ${statusCounts.FAILED || 0}`}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-1 pt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100% Pipeline Telemetry</span>
          </div>
        </div>
      </div>

      {/* Grid: Popular Manga & Recent Error Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Manga */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 border border-[#E5E0D8] bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
            <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-base">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span className="font-sans">Top Series (Catalog Views)</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Database Records</span>
          </div>

          <div className="space-y-3.5">
            {popularManga.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono py-8 text-center">No manga catalog records available.</p>
            ) : (
              popularManga.map((m, idx) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] hover:border-red-300 transition-all group">
                  <div className="flex items-center gap-3.5">
                    <span className="w-7 h-7 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold font-mono flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 font-sans group-hover:text-red-600 transition-colors">{m.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-red-700 uppercase font-mono px-2 py-0.5 rounded-full bg-red-100 border border-red-200">
                          {m.source_provider}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono">{m.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-900 font-bold bg-white px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] shrink-0 shadow-sm">
                    <Eye className="w-3.5 h-3.5 text-red-600" />
                    <span>{m.view_count.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Logs Feed */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 border border-[#E5E0D8] bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
            <div className="flex items-center gap-2.5 text-red-600 font-bold text-base">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
              <span className="font-sans">System Exception Feed</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Latest Live Failures</span>
          </div>

          <div className="space-y-3.5">
            {recentErrors.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                <span>Zero system errors logged. Ingestion engine operating nominally.</span>
              </div>
            ) : (
              recentErrors.slice(0, 5).map((err) => (
                <div key={err.id} className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2 hover:bg-red-100/50 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                      <span className="font-mono font-bold text-red-700 uppercase tracking-wider">{err.error_type}</span>
                      {err.provider && (
                        <span className="text-[10px] font-mono text-zinc-600 uppercase bg-white px-2 py-0.5 rounded-full border border-red-200">
                          {err.provider}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(err.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-800 font-mono break-all leading-relaxed" title={err.error_detail}>
                    {err.error_detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
