"use client";

import { useState } from "react";
import { Lock, ShieldCheck, KeyRound, AlertTriangle, Eye, EyeOff, Terminal, Sparkles } from "lucide-react";
import { loginAdmin } from "@/app/actions";

interface PasswordGateProps {
  onSuccess: () => void;
}

export function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await loginAdmin(password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Access Denied: Invalid Master Password");
      }
    } catch {
      setError("System Exception: Authentication server unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF8F5] backdrop-blur-2xl scanline">
      {/* Ambient Red Glows */}
      <div className="glow-bg-red" />

      <div className="w-full max-w-md p-8 glass-panel-glow rounded-3xl text-center shadow-xl relative overflow-hidden transition-all border border-[#E5E0D8] bg-white">
        {/* Top Crimson Rail */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-400" />

        {/* Security Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-mono tracking-wider uppercase mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          Air-Gapped Ingestion Gate
        </div>

        {/* Floating Lock Emblem */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm transition-transform hover:scale-105">
          <ShieldCheck className="w-10 h-10 text-red-600 animate-pulse" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-zinc-900 font-sans">
          Senpai Den Admin
        </h1>
        <p className="text-xs text-zinc-500 mb-8 max-w-xs mx-auto leading-relaxed font-sans">
          Authentication required. Enter the master access key to initialize ingestion controls and live telemetry.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider block">
              Master Access Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password..."
                className="w-full pl-10 pr-10 py-3.5 rounded-2xl glass-input text-sm font-mono tracking-wide border-[#E5E0D8] bg-white text-zinc-900 focus:border-red-600 shadow-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 font-sans"
          >
            {loading ? (
              <span className="flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 animate-spin text-white" />
                VERIFYING MASTER KEY...
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>UNLOCK COMMAND CENTER</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-[#E5E0D8] flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>AIR-GAPPED SYSTEM</span>
          <span className="text-zinc-600 font-bold">SENPAI DEN v1.0</span>
        </div>
      </div>
    </div>
  );
}
