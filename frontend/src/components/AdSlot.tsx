"use client";

import { useEffect, useRef, useState } from "react";
import { CONSENT_UPDATED_EVENT, getConsent } from "@/lib/consent";
import {
  AD_PLACEMENT_ENABLED,
  AD_SLOT_BY_PLACEMENT,
  ADS_ENABLED,
  ADS_PREVIEW,
  ADSENSE_CLIENT,
  ADSTERRA_BANNER_HTML,
  ADSTERRA_BANNER_KEY,
  canServeAdsInBrowser,
  type AdPlacement,
} from "@/lib/monetization";
import { hasActivePremium } from "@/lib/reader-progression";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export function AdSlot({
  placement,
  className = "",
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const initialized = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slot = AD_SLOT_BY_PLACEMENT[placement];
  const isEnabled = AD_PLACEMENT_ENABLED[placement];

  useEffect(() => {
    const sync = () => {
      const isAllowed = Boolean(
        canServeAdsInBrowser() &&
          (ADS_ENABLED || ADS_PREVIEW) &&
          isEnabled &&
          !hasActivePremium()
      );
      setVisible(isAllowed);
    };

    sync();
    window.addEventListener(CONSENT_UPDATED_EVENT, sync);
    window.addEventListener("senpai-premium-updated", sync);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, sync);
      window.removeEventListener("senpai-premium-updated", sync);
    };
  }, [isEnabled]);

  // Google AdSense auto-push
  useEffect(() => {
    if (visible && ADSENSE_CLIENT && slot && !initialized.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch {}
    }
  }, [visible, slot]);

  // Adsterra Banner Injection
  useEffect(() => {
    if (!visible || !containerRef.current || initialized.current) return;

    if (ADSTERRA_BANNER_HTML) {
      containerRef.current.innerHTML = ADSTERRA_BANNER_HTML;
      initialized.current = true;
    } else if (ADSTERRA_BANNER_KEY) {
      const confScript = document.createElement("script");
      confScript.type = "text/javascript";
      confScript.innerHTML = `
        atOptions = {
          'key' : '${ADSTERRA_BANNER_KEY}',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = `//www.highperformanceformat.com/${ADSTERRA_BANNER_KEY}/invoke.js`;
      
      containerRef.current.appendChild(confScript);
      containerRef.current.appendChild(invokeScript);
      initialized.current = true;
    }
  }, [visible]);

  if (!visible) return null;

  // Real AdSense Banner
  if (ADSENSE_CLIENT && slot) {
    return (
      <aside
        className={`mx-auto min-h-[90px] w-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-2 text-center ${className}`}
        aria-label="Advertisement"
      >
        <p className="mb-1 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Advertisement
        </p>
        <ins
          className="adsbygoogle block"
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    );
  }

  // Real Adsterra / Custom HTML Banner
  if (ADSTERRA_BANNER_KEY || ADSTERRA_BANNER_HTML) {
    return (
      <aside
        className={`mx-auto min-h-[90px] w-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-2 text-center ${className}`}
        aria-label="Advertisement"
      >
        <p className="mb-1 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Advertisement
        </p>
        <div ref={containerRef} className="flex justify-center items-center min-h-[90px]" />
      </aside>
    );
  }

  // Visual Banner Placeholder / Preview Mode (Shows where the banner is positioned)
  return (
    <aside
      className={`mx-auto my-3 grid min-h-[100px] w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-violet-500/30 bg-[repeating-linear-gradient(135deg,rgba(139,92,246,0.03)_0,rgba(139,92,246,0.03)_12px,transparent_12px,transparent_24px)] p-4 text-center ${className}`}
      aria-label={`Banner Ad: ${placement}`}
    >
      <div className="flex flex-col items-center">
        <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
          📢 Ad Banner Space ({placement})
        </span>
        <p className="mt-2 text-xs font-semibold text-zinc-300">
          Responsive Ad Banner (Adsterra / 728x90 / 300x250)
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Paste your Adsterra code or banner key in .env to activate live ads
        </p>
      </div>
    </aside>
  );
}

