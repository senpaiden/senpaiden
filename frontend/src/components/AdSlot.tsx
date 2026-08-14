"use client";

import { useEffect, useRef, useState } from "react";
import { CONSENT_UPDATED_EVENT, getConsent } from "@/lib/consent";
import { AD_PLACEMENT_ENABLED, AD_SLOT_BY_PLACEMENT, ADS_ENABLED, ADS_PREVIEW, ADSENSE_CLIENT, canServeAdsInBrowser, type AdPlacement } from "@/lib/monetization";
import { hasActivePremium } from "@/lib/reader-progression";

declare global { interface Window { adsbygoogle?: Record<string, unknown>[] } }

export function AdSlot({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  const [visible, setVisible] = useState(false);
  const initialized = useRef(false);
  const slot = AD_SLOT_BY_PLACEMENT[placement];
  const preview = process.env.NODE_ENV !== "production" && ADS_PREVIEW && AD_PLACEMENT_ENABLED[placement];
  useEffect(() => {
    const sync = () => setVisible(Boolean(canServeAdsInBrowser() && ADS_ENABLED && AD_PLACEMENT_ENABLED[placement] && ADSENSE_CLIENT && slot && getConsent()?.advertising && !hasActivePremium()));
    sync(); window.addEventListener(CONSENT_UPDATED_EVENT, sync); window.addEventListener("senpai-premium-updated", sync);
    return () => { window.removeEventListener(CONSENT_UPDATED_EVENT, sync); window.removeEventListener("senpai-premium-updated", sync); };
  }, [placement, slot]);
  useEffect(() => { if (visible && !initialized.current) try { (window.adsbygoogle = window.adsbygoogle || []).push({}); initialized.current = true; } catch {} }, [visible]);
  if (preview) return <aside className={`mx-auto grid min-h-[132px] w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-cyan-300/30 bg-[repeating-linear-gradient(135deg,rgba(34,211,238,0.025)_0,rgba(34,211,238,0.025)_12px,transparent_12px,transparent_24px)] p-5 text-center ${className}`} aria-label={`Ad placement preview: ${placement}`}><div><span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Preview only · no real ad</span><p className="mt-3 text-sm font-black text-white">{placement.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")} advertisement</p><p className="mt-1 text-xs text-zinc-500">This reserved area prevents layout shift when advertising is activated.</p></div></aside>;
  if (!visible) return null;
  return <aside className={`mx-auto min-h-[120px] w-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-2 ${className}`} aria-label="Advertisement"><p className="mb-2 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">Advertisement</p><ins className="adsbygoogle block" data-ad-client={ADSENSE_CLIENT} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" /></aside>;
}
