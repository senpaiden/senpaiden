"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-mono scanline relative overflow-hidden">
      <div className="glow-bg-red" />
      <div className="glow-bg-dark" />

      <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full text-center space-y-6 border border-red-500/30 shadow-2xl relative z-10 bg-black/90">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-500 shadow-neon-red animate-pulse">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-red-950/60 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/40 shadow-neon-red">
            HTTP 404 • Resource Exception
          </span>
          <h1 className="text-3xl font-extrabold font-sans text-white">Page Not Found</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The requested administrative endpoint or telemetry route does not exist on this air-gapped instance.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-neon-red transition-all font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Command Center</span>
        </Link>
      </div>
    </div>
  );
}
