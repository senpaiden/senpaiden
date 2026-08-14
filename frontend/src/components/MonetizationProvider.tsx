"use client";

import { useEffect, useState } from "react";
import { CONSENT_UPDATED_EVENT, getConsent, type ConsentPreferences } from "@/lib/consent";
import { ADS_ENABLED, ADSENSE_CLIENT, canServeAdsInBrowser } from "@/lib/monetization";
import { hasActivePremium } from "@/lib/reader-progression";

const SCRIPT_ID = "senpaiden-adsense-script";

export function MonetizationProvider() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = (preferences?: ConsentPreferences | null) => setAllowed(Boolean(canServeAdsInBrowser() && ADS_ENABLED && ADSENSE_CLIENT && (preferences || getConsent())?.advertising && !hasActivePremium()));
    sync();
    const onConsent = (event: Event) => sync((event as CustomEvent<ConsentPreferences>).detail);
    const onPremium = () => sync();
    window.addEventListener(CONSENT_UPDATED_EVENT, onConsent);
    window.addEventListener("senpai-premium-updated", onPremium);
    return () => { window.removeEventListener(CONSENT_UPDATED_EVENT, onConsent); window.removeEventListener("senpai-premium-updated", onPremium); };
  }, []);

  useEffect(() => {
    if (!allowed || document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
    document.head.appendChild(script);
  }, [allowed]);

  return null;
}
