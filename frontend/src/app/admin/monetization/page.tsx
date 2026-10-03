import { BadgeCheck, CircleAlert, CircleX, Gauge, ShieldCheck } from "lucide-react";
import {
  ADS_ENABLED,
  ADS_TEMPORARILY_DISABLED,
  ADSTERRA_DESKTOP_KEY,
  ADSTERRA_MOBILE_KEY,
  ADSTERRA_NATIVE_CONTAINER,
  AD_PLACEMENT_ENABLED,
} from "@/lib/monetization";

export const dynamic = "force-dynamic";

export default function MonetizationStatusPage() {
  const isHexKey = (key?: string) => Boolean(key && /^[a-f0-9]{32}$/i.test(key));
  const isContainerKey = (key?: string) => Boolean(key && /^container-[a-f0-9]{32}$/i.test(key));

  const checks = [
    ["Global advertising", ADS_ENABLED, "NEXT_PUBLIC_ADS_ENABLED"],
    ["Adsterra Desktop 728x90 Banner", isHexKey(ADSTERRA_DESKTOP_KEY), "ADSTERRA_DESKTOP_KEY (32-char hex)"],
    ["Adsterra Mobile 320x50 Banner", isHexKey(ADSTERRA_MOBILE_KEY), "ADSTERRA_MOBILE_KEY (32-char hex)"],
    ["Adsterra Native Widget Container", isContainerKey(ADSTERRA_NATIVE_CONTAINER), "ADSTERRA_NATIVE_CONTAINER"],
    ["Home feed placement", AD_PLACEMENT_ENABLED["home-feed"], "NEXT_PUBLIC_ADS_PLACEMENT_HOME"],
    ["Discover grid placement", AD_PLACEMENT_ENABLED["discover-grid"], "NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER"],
    ["Manga detail placement", AD_PLACEMENT_ENABLED["manga-detail"], "NEXT_PUBLIC_ADS_PLACEMENT_DETAIL"],
    ["Reader intermission placement", AD_PLACEMENT_ENABLED["reader-bottom"], "NEXT_PUBLIC_ADS_PLACEMENT_READER_BOTTOM"],
    ["Library bottom placement", AD_PLACEMENT_ENABLED["library-bottom"], "NEXT_PUBLIC_ADS_PLACEMENT_LIBRARY"],
    ["History bottom placement", AD_PLACEMENT_ENABLED["history-bottom"], "NEXT_PUBLIC_ADS_PLACEMENT_HISTORY"],
    ["Notifications bottom placement", AD_PLACEMENT_ENABLED["notifications-bottom"], "NEXT_PUBLIC_ADS_PLACEMENT_NOTIFICATIONS"],
    ["Discover bottom placement", AD_PLACEMENT_ENABLED["discover-bottom"], "NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER_BOTTOM"],
  ] as const;

  const activeCount = checks.filter(([, active]) => active).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <header className="rounded-3xl border border-white/10 bg-[#11131A] p-7 md:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-400">
          <Gauge className="h-6 w-6" />
        </span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
          Protected admin view
        </p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
          Monetization status
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Configuration visibility only. Secrets and full identifiers are never displayed here.
        </p>
      </header>

      {ADS_TEMPORARILY_DISABLED && (
        <div className="mt-6 flex items-start gap-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-300">
          <CircleAlert className="h-6 w-6 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="block font-bold text-amber-200">
              Ads & Commercial Pages Temporarily Disabled (Growth Phase)
            </strong>
            <p className="mt-1 text-xs text-amber-200/80 leading-relaxed">
              All client-facing advertisements, popunder scripts, banners, video sponsors, and commercial links (/partners, /affiliate-disclosure) are disabled to maximize reader acquisition and retention.
              To re-enable when ready, switch <code className="bg-black/30 px-1 py-0.5 rounded font-mono">ADS_TEMPORARILY_DISABLED = false</code> in <code className="bg-black/30 px-1 py-0.5 rounded font-mono">src/lib/monetization.ts</code>.
            </p>
          </div>
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#11131A]">
        <div className="flex items-center justify-between border-b border-white/5 p-5 md:p-6">
          <div>
            <h2 className="font-black text-white">Release gates</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {activeCount}/{checks.length} technical switches ready
            </p>
          </div>
          <ShieldCheck className="h-6 w-6 text-zinc-500" />
        </div>
        {checks.map(([label, active, hint]) => (
          <div
            key={label}
            className="flex items-center gap-4 border-b border-white/5 p-5 last:border-0 md:px-6"
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ${
                active ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-zinc-600"
              }`}
            >
              {active ? <BadgeCheck className="h-5 w-5" /> : <CircleX className="h-5 w-5" />}
            </span>
            <div>
              <strong className="text-sm text-white">{label}</strong>
              <p className="mt-1 text-xs text-zinc-600">
                {active ? "Configured" : `Inactive: ${hint}`}
              </p>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-6 flex gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs leading-5 text-amber-100/70">
        <CircleAlert className="h-5 w-5 shrink-0 text-amber-300" />
        <p>
          Technical readiness does not replace Adsterra compliance or certified CMP verification. Development and localhost traffic remain controlled.
        </p>
      </div>
    </div>
  );
}
