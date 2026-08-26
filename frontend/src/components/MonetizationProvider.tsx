"use client";

import { useEffect, useState } from "react";
import { CONSENT_UPDATED_EVENT, getConsent, type ConsentPreferences } from "@/lib/consent";
import {
  ADS_ENABLED,
  ADSENSE_CLIENT,
  ADSTERRA_SCRIPT_URL,
  canServeAdsInBrowser,
} from "@/lib/monetization";
import { hasActivePremium } from "@/lib/reader-progression";

const ADSENSE_SCRIPT_ID = "senpaiden-adsense-script";
const ADSTERRA_SCRIPT_ID = "senpaiden-adsterra-script";

export function MonetizationProvider() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = (preferences?: ConsentPreferences | null) =>
      setAllowed(
        Boolean(
          canServeAdsInBrowser() &&
            ADS_ENABLED &&
            (preferences || getConsent())?.advertising
        )
      );
    sync();
    const onConsent = (event: Event) =>
      sync((event as CustomEvent<ConsentPreferences>).detail);
    window.addEventListener(CONSENT_UPDATED_EVENT, onConsent);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, onConsent);
    };
  }, []);

  // Inject Google AdSense Script
  useEffect(() => {
    if (!allowed || !ADSENSE_CLIENT || document.getElementById(ADSENSE_SCRIPT_ID))
      return;
    const script = document.createElement("script");
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      ADSENSE_CLIENT
    )}`;
    document.head.appendChild(script);
  }, [allowed]);

  // Inject Adsterra Global Script (Social Bar / Popunder)
  useEffect(() => {
    if (
      !allowed ||
      !ADSTERRA_SCRIPT_URL ||
      document.getElementById(ADSTERRA_SCRIPT_ID)
    )
      return;
    const script = document.createElement("script");
    script.id = ADSTERRA_SCRIPT_ID;
    script.type = "text/javascript";
    script.async = true;
    script.src = ADSTERRA_SCRIPT_URL;
    document.head.appendChild(script);
  }, [allowed]);

  return null;
}

