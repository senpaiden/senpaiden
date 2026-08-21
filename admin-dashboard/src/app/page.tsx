"use client";

import { useState, useEffect, useCallback } from "react";
import { checkAdminSession, getDashboardMetrics } from "@/app/actions";
import { PasswordGate } from "@/components/PasswordGate";
import { AdminHeader } from "@/components/AdminHeader";
import { OverviewTab } from "@/components/OverviewTab";
import { MangaCatalogManager } from "@/components/MangaCatalogManager";
import { BatchIngestionControl } from "@/components/BatchIngestionControl";
import { ManualScraperControl } from "@/components/ManualScraperControl";
import { DlqManager } from "@/components/DlqManager";
import { Activity, Sparkles, AlertTriangle, ShieldCheck, Cpu, Database, Layers, BookOpen } from "lucide-react";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "batch" | "scraper" | "dlq">("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Check initial session
  useEffect(() => {
    checkAdminSession().then((authenticated) => {
      setIsAuthenticated(authenticated);
    });
  }, []);

  // Fetch metrics data from Supabase
  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || "Failed to sync system telemetry metrics.");
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  // Initial fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchMetrics();
    }
  }, [isAuthenticated, fetchMetrics]);

  // Auto-refresh interval effect (every 10s)
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, fetchMetrics]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] text-zinc-600 font-mono scanline">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-md animate-pulse">
            <Cpu className="w-8 h-8 animate-spin-slow" />
          </div>
          <span className="text-xs tracking-widest uppercase font-bold text-red-600">INITIALIZING COMMAND HUB...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-zinc-900 flex flex-col relative overflow-x-hidden scanline">
      {/* Red Radial Background Glow Leaks */}
      <div className="glow-bg-red" />
      <div className="glow-bg-dark" />

      {/* Top HUD Header */}
      <AdminHeader
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onManualRefresh={fetchMetrics}
        isRefreshing={isRefreshing}
        lastRefreshed={metrics?.lastRefreshed}
        onLock={() => setIsAuthenticated(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:px-8 space-y-8 relative z-10">

        {/* Navigation Tab Bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E0D8] pb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-red-600 text-white shadow-md scale-[1.02]"
                : "bg-white text-zinc-700 hover:text-black hover:bg-[#F3EFE6] border border-[#E5E0D8]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview & Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-red-600 text-white shadow-md scale-[1.02]"
                : "bg-white text-zinc-700 hover:text-black hover:bg-[#F3EFE6] border border-[#E5E0D8]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Full Catalog ({metrics?.mangaCount || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("batch")}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "batch"
                ? "bg-red-600 text-white shadow-md scale-[1.02]"
                : "bg-white text-zinc-700 hover:text-black hover:bg-[#F3EFE6] border border-[#E5E0D8]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mass Batch Queue (100+)</span>
          </button>

          <button
            onClick={() => setActiveTab("scraper")}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "scraper"
                ? "bg-red-600 text-white shadow-md scale-[1.02]"
                : "bg-white text-zinc-700 hover:text-black hover:bg-[#F3EFE6] border border-[#E5E0D8]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Single Scraper</span>
          </button>

          <button
            onClick={() => setActiveTab("dlq")}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "dlq"
                ? "bg-red-600 text-white shadow-md scale-[1.02]"
                : "bg-white text-zinc-700 hover:text-black hover:bg-[#F3EFE6] border border-[#E5E0D8]"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Dead Letter Queue ({metrics?.dlqCount || 0})</span>
          </button>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-medium flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Tab View */}
        {metrics && activeTab === "overview" && (
          <OverviewTab metrics={metrics} onSwitchTab={(tab) => setActiveTab(tab as any)} />
        )}

        {activeTab === "catalog" && (
          <MangaCatalogManager />
        )}

        {activeTab === "batch" && (
          <BatchIngestionControl onRefreshMetrics={fetchMetrics} />
        )}

        {activeTab === "scraper" && (
          <ManualScraperControl popularManga={metrics?.popularManga || []} />
        )}

        {metrics && activeTab === "dlq" && (
          <DlqManager dlqItems={metrics.dlqItems} onRefresh={fetchMetrics} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] py-6 text-center text-xs text-zinc-500 font-mono relative z-10 bg-white/80 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-600" />
            <span>Air-Gapped Standalone Admin Instance • Senpai Den v1.0</span>
          </div>
          <span className="hidden sm:inline text-zinc-400">•</span>
          <div className="flex items-center gap-2 text-zinc-600">
            <Database className="w-3.5 h-3.5 text-zinc-900" />
            <span>Supabase Ingestion Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
