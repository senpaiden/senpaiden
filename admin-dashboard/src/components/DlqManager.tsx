"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, AlertTriangle, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { retryDlqItem, bulkRetryFailed } from "@/app/actions";

interface DlqManagerProps {
  dlqItems: Array<{
    id: string;
    chapter_id: string;
    error_type: string;
    error_detail: string;
    retry_count: number;
    max_retries: number;
    created_at: string;
    chapters?: {
      title?: string;
      chapter_number?: number;
      manga?: { title?: string };
    };
  }>;
  onRefresh: () => void;
}

export function DlqManager({ dlqItems, onRefresh }: DlqManagerProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleForceRetry = async (dlqId: string, chapterId: string) => {
    setLoadingId(dlqId);
    setMsg(null);
    try {
      await retryDlqItem(dlqId, chapterId);
      onRefresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleBulkRetry = async () => {
    setBulkLoading(true);
    setMsg(null);
    try {
      const res = await bulkRetryFailed();
      if (res.success) {
        setMsg(`Successfully re-queued ${res.retriedCount} failed chapter ingestion jobs.`);
        onRefresh();
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredItems = dlqItems.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const seriesTitle = item.chapters?.manga?.title?.toLowerCase() || "";
    const errorType = item.error_type.toLowerCase();
    const errorDetail = item.error_detail.toLowerCase();
    return seriesTitle.includes(q) || errorType.includes(q) || errorDetail.includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Header Actions Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel p-6 md:p-8 rounded-3xl border border-[#E5E0D8] relative overflow-hidden bg-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm shrink-0">
            <AlertTriangle className="w-7 h-7 text-red-600 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-zinc-900 font-sans tracking-tight">
              Dead Letter Queue (DLQ) Manager
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              Inspect failed ingestion jobs, view raw exception traces, and execute automated queue recovery
            </p>
          </div>
        </div>

        <button
          onClick={handleBulkRetry}
          disabled={bulkLoading}
          className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer font-sans"
        >
          <RotateCcw className={`w-4 h-4 ${bulkLoading ? "animate-spin" : ""}`} />
          <span>Bulk Retry All Failed Jobs</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter DLQ items..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs font-mono bg-white border-[#E5E0D8] text-zinc-900 shadow-sm"
          />
        </div>

        <span className="text-xs font-mono text-zinc-500">
          Showing <strong className="text-zinc-900">{filteredItems.length}</strong> of {dlqItems.length} DLQ records
        </span>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* DLQ Records List */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-[#E5E0D8] bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-600 uppercase font-mono bg-[#F3EFE6] border-b border-[#E5E0D8]">
              <tr>
                <th className="px-6 py-4 font-bold">Series & Chapter</th>
                <th className="px-6 py-4 font-bold">Error Exception</th>
                <th className="px-6 py-4 font-bold">Retry Telemetry</th>
                <th className="px-6 py-4 font-bold">Timestamp</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8] font-mono">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-emerald-600 opacity-80" />
                    <p className="font-bold text-zinc-900">DLQ Queue is Clear</p>
                    <p className="text-xs text-zinc-500 mt-1">Zero unhandled chapter ingestion failures found.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9F7F2] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 font-sans text-sm">
                        {item.chapters?.manga?.title || "Unknown Series"}
                      </div>
                      <div className="text-xs text-red-600 mt-0.5">
                        Chapter #{item.chapters?.chapter_number || "?"} {item.chapters?.title ? `— ${item.chapters.title}` : ""}
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-md">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-100 border border-red-200 text-red-700">
                        {item.error_type}
                      </span>
                      <p className="text-xs text-zinc-700 mt-1 truncate" title={item.error_detail}>
                        {item.error_detail}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <span className="text-zinc-900 font-bold">{item.retry_count}</span>
                      <span className="text-zinc-500"> / {item.max_retries} Retries</span>
                    </td>

                    <td className="px-6 py-4 text-xs text-zinc-500">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleForceRetry(item.id, item.chapter_id)}
                        disabled={loadingId === item.id}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F3EFE6] text-zinc-800 font-bold text-xs border border-[#E5E0D8] transition-all cursor-pointer flex items-center gap-1.5 ml-auto shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingId === item.id ? "animate-spin text-red-600" : "text-zinc-600"}`} />
                        <span>Force Retry</span>
                      </button>
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
