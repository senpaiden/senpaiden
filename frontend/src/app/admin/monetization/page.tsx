import { BadgeCheck, CircleAlert, CircleX, Gauge, ShieldCheck } from "lucide-react";

const truthy = (value?: string) => value === "true";
export const dynamic = "force-dynamic";

export default function MonetizationStatusPage() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  const checks = [
    ["Global advertising", truthy(process.env.NEXT_PUBLIC_ADS_ENABLED), "NEXT_PUBLIC_ADS_ENABLED"],
    ["AdSense publisher ID", /^ca-pub-\d+$/.test(client), "NEXT_PUBLIC_ADSENSE_CLIENT"],
    ["Home placement", truthy(process.env.NEXT_PUBLIC_ADS_PLACEMENT_HOME) && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME), "Home flag + slot"],
    ["Discover placement", truthy(process.env.NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER) && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISCOVER), "Discover flag + slot"],
    ["Detail placement", truthy(process.env.NEXT_PUBLIC_ADS_PLACEMENT_DETAIL) && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL), "Detail flag + slot"],
    ["Library placement", truthy(process.env.NEXT_PUBLIC_ADS_PLACEMENT_LIBRARY) && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIBRARY), "Library flag + slot"],
    ["History placement", truthy(process.env.NEXT_PUBLIC_ADS_PLACEMENT_HISTORY) && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_HISTORY), "History flag + slot"],
    ["Notifications placement", truthy(process.env.NEXT_PUBLIC_ADS_PLACEMENT_NOTIFICATIONS) && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_NOTIFICATIONS), "Notifications flag + slot"],
    ["Discover bottom placement", truthy(process.env.NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER_BOTTOM) && Boolean(process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISCOVER_BOTTOM), "Discover bottom flag + slot"],
  ] as const;
  const activeCount = checks.filter(([, active]) => active).length;
  return <div className="mx-auto max-w-5xl px-4 py-10 md:px-8"><header className="rounded-3xl border border-white/10 bg-[#11131A] p-7 md:p-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-400"><Gauge className="h-6 w-6" /></span><p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Protected admin view</p><h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Monetization status</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Configuration visibility only. Secrets and full identifiers are never displayed here.</p></header><section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#11131A]"><div className="flex items-center justify-between border-b border-white/5 p-5 md:p-6"><div><h2 className="font-black text-white">Release gates</h2><p className="mt-1 text-xs text-zinc-500">{activeCount}/{checks.length} technical switches ready</p></div><ShieldCheck className="h-6 w-6 text-zinc-500" /></div>{checks.map(([label, active, hint]) => <div key={label} className="flex items-center gap-4 border-b border-white/5 p-5 last:border-0 md:px-6"><span className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-zinc-600"}`}>{active ? <BadgeCheck className="h-5 w-5" /> : <CircleX className="h-5 w-5" />}</span><div><strong className="text-sm text-white">{label}</strong><p className="mt-1 text-xs text-zinc-600">{active ? "Configured" : `Inactive: ${hint}`}</p></div></div>)}</section><div className="mt-6 flex gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs leading-5 text-amber-100/70"><CircleAlert className="h-5 w-5 shrink-0 text-amber-300" /><p>Technical readiness does not replace rights review, AdSense approval or certified CMP verification. Development and localhost traffic remain hard-disabled.</p></div></div>;
}
