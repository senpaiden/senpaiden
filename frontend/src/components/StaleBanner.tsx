"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StaleBannerProps {
  freshness?: "fresh" | "stale" | "archived";
}

export function StaleBanner({ freshness }: StaleBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (freshness !== "stale" || dismissed) return null;

  return (
    <div 
      className={cn(
        "fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md",
        "glass-panel bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
        "flex items-start gap-3 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-10 duration-500"
      )}
    >
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <h4 className="font-display font-semibold text-sm">Provider Blackout Detected</h4>
        <p className="text-xs opacity-90 leading-relaxed">
          The upstream sources are currently down. You are viewing a cached version of this chapter. Some images may be missing.
        </p>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-full p-1 hover:bg-yellow-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
