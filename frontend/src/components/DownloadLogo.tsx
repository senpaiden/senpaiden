import { useEffect, useState } from "react";
import { Check, X, Pause } from "lucide-react";

export type DownloadState = "downloading" | "paused" | "completed" | "failed";

interface Props {
  progress?: number; // 0..100
  state?: DownloadState;
  compact?: boolean;
  label?: string;
}

/**
 * Signature Senpai Den download animation.
 * A violet logo rises along a cyan glowing vertical path.
 */
export function DownloadLogo({ progress: controlledProgress, state = "downloading", compact = false, label = "Downloading" }: Props) {
  const [p, setP] = useState(controlledProgress ?? 0);

  useEffect(() => {
    if (controlledProgress !== undefined) {
      setP(controlledProgress);
      return;
    }
    if (state !== "downloading") return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const pct = Math.min(100, ((now - start) / 5000) * 100);
      setP(pct);
      if (pct < 100) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [controlledProgress, state]);

  const height = compact ? 120 : 220;

  const stateColor =
    state === "completed" ? "#22C55E" :
    state === "failed" ? "#EF4444" :
    state === "paused" ? "#71717A" :
    "#22D3EE";

  return (
    <div className={`relative flex items-center gap-3 ${compact ? "" : "flex-col"}`}>
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: 6,
          height,
          background: "rgba(255,255,255,0.05)",
        }}
      >
        {/* Filled path */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-300 ease-out"
          style={{
            height: `${p}%`,
            background:
              state === "failed"
                ? "linear-gradient(180deg, #EF4444, #7f1d1d)"
                : state === "completed"
                ? "linear-gradient(180deg, #22C55E, #14532d)"
                : "linear-gradient(180deg, #22D3EE 0%, #8B5CF6 60%, #A855F7 100%)",
            boxShadow: `0 0 12px ${stateColor}, 0 0 24px ${stateColor}55`,
          }}
        />
        {/* Rising particles */}
        {state === "downloading" &&
          Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#22D3EE]"
              style={{
                bottom: 0,
                boxShadow: "0 0 8px #22D3EE, 0 0 14px #8B5CF6",
                animation: `sdRise 2.4s linear ${i * 0.5}s infinite`,
              }}
            />
          ))}

        {/* Rising Logo */}
        <div
          className="absolute left-1/2 -translate-x-1/2 transition-[bottom] duration-500 ease-out"
          style={{ bottom: `calc(${p}% - 12px)` }}
        >
          <div
            className={`grid h-6 w-6 place-items-center rounded-md font-black text-[11px] text-white ${
              state === "downloading" ? "sd-gradient" : ""
            }`}
            style={{
              background:
                state === "completed" ? "#22C55E" :
                state === "failed" ? "#EF4444" :
                state === "paused" ? "#3f3f46" :
                undefined,
              boxShadow: `0 0 16px ${stateColor}aa`,
            }}
          >
            {state === "completed" ? <Check className="h-3.5 w-3.5" /> :
             state === "failed" ? <X className="h-3.5 w-3.5" /> :
             state === "paused" ? <Pause className="h-3 w-3" /> :
             "先"}
          </div>
        </div>
      </div>

      <div className={compact ? "flex-1" : "text-center"}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">
          {state === "completed" ? "Ready" : state === "failed" ? "Failed" : state === "paused" ? "Paused" : label}
        </div>
        <div className="mt-0.5 text-lg font-bold tabular-nums text-white">
          {Math.floor(p)}%
        </div>
      </div>
    </div>
  );
}
