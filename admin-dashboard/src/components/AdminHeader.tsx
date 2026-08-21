"use client";

import { RefreshCw, Lock, Radio, Activity, PauseCircle, Cpu } from "lucide-react";
import { logoutAdmin } from "@/app/actions";

interface AdminHeaderProps {
  autoRefresh: boolean;
  onToggleAutoRefresh: (val: boolean) => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  lastRefreshed?: string;
  onLock: () => void;
}

export function AdminHeader({
  autoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  isRefreshing,
  lastRefreshed,
  onLock,
}: AdminHeaderProps) {
  const handleLogout = async () => {
    await logoutAdmin();
    onLock();
  };

  const formattedTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Never';

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-[#E5E0D8] px-4 py-3.5 md:px-8 shadow-md backdrop-blur-2xl bg-white/95 text-zinc-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Status */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm shrink-0">
            <Cpu className="w-6 h-6 animate-pulse text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-zinc-900 font-sans">
                Senpai Den Admin Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 uppercase tracking-wider">
                Standalone
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                ONLINE
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Air-Gapped Ingestion Operations & Real-Time Analytics Engine
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl glass-input text-xs border-[#E5E0D8] bg-[#F3EFE6]">
            <span className="text-zinc-600 font-mono font-medium flex items-center gap-1.5">
              {autoRefresh ? (
                <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              ) : (
                <PauseCircle className="w-3.5 h-3.5 text-zinc-400" />
              )}
              {autoRefresh ? "Auto (10s)" : "Manual"}
            </span>

            <button
              onClick={() => onToggleAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoRefresh ? "bg-red-600" : "bg-zinc-300"
              }`}
              title="Toggle 10s auto-refresh telemetry"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoRefresh ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-input hover:bg-[#F3EFE6] hover:border-red-400 text-xs font-semibold text-zinc-800 transition-all border border-[#E5E0D8] active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Fetch latest system metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-red-600" : "text-zinc-600"}`} />
            <span className="font-mono">Sync</span>
          </button>

          {/* Last Refreshed Time */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#F3EFE6] border border-[#E5E0D8] text-[11px] font-mono text-zinc-600">
            <Activity className="w-3 h-3 text-red-600" />
            <span>Updated: {formattedTime}</span>
          </div>

          {/* Lock / Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-all ml-auto md:ml-0 cursor-pointer"
            title="Lock Command Center"
          >
            <Lock className="w-3.5 h-3.5 text-red-600" />
            <span className="font-mono">Lock</span>
          </button>
        </div>
      </div>
    </header>
  );
}
