"use client";

import { useEffect, useRef, useState } from "react";
import { CONSENT_UPDATED_EVENT } from "@/lib/consent";
import {
  AD_PLACEMENT_ENABLED,
  ADS_ENABLED,
  canServeAdsInBrowser,
  type AdPlacement,
} from "@/lib/monetization";
import { hasActivePremium } from "@/lib/reader-progression";

const ADSTERRA_DESKTOP_KEY = "2de4d4b4a2f675e5880e6d1004852c8b"; // 728x90
const ADSTERRA_MOBILE_KEY = "e595c21e4de14999cdb8003e66163d4b";   // 320x50
const ADSTERRA_NATIVE_CONTAINER = "container-d151fe0fbadd628be5d88b715d6a1e68";
const ADSTERRA_NATIVE_SRC = "https://pl30953537.effectivecpmnetwork.com/d151fe0fbadd628be5d88b715d6a1e68/invoke.js";

export function AdSlot({
  placement,
  className = "",
  variant = "auto",
}: {
  placement: AdPlacement;
  className?: string;
  variant?: "auto" | "native" | "banner";
}) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEnabled = AD_PLACEMENT_ENABLED[placement];

  useEffect(() => {
    const sync = () => {
      const isAllowed = Boolean(
        canServeAdsInBrowser() &&
          ADS_ENABLED &&
          isEnabled
      );
      setVisible(isAllowed);
    };

    sync();
    window.addEventListener(CONSENT_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, sync);
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = ""; // Clear previous content

    const isMobile = window.innerWidth < 768;

    if (variant === "native") {
      const nativeDiv = document.createElement("div");
      nativeDiv.id = ADSTERRA_NATIVE_CONTAINER;
      
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = ADSTERRA_NATIVE_SRC;

      container.appendChild(script);
      container.appendChild(nativeDiv);
    } else {
      // Responsive Iframe Banner (728x90 on desktop, 320x50 on mobile)
      const adKey = isMobile ? ADSTERRA_MOBILE_KEY : ADSTERRA_DESKTOP_KEY;
      const width = isMobile ? 320 : 728;
      const height = isMobile ? 50 : 90;

      const iframe = document.createElement("iframe");
      iframe.width = width.toString();
      iframe.height = height.toString();
      iframe.frameBorder = "0";
      iframe.scrolling = "no";
      iframe.style.border = "none";
      iframe.style.overflow = "hidden";
      iframe.style.display = "block";
      iframe.style.margin = "0 auto";

      container.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }</style>
            </head>
            <body>
              <script type="text/javascript">
                atOptions = {
                  'key' : '${adKey}',
                  'format' : 'iframe',
                  'height' : ${height},
                  'width' : ${width},
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="//www.highperformanceformat.com/${adKey}/invoke.js"></script>
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [visible, variant]);

  if (!visible) return null;

  return (
    <aside
      className={`mx-auto my-3 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-2 text-center shadow-lg ${className}`}
      aria-label="Advertisement"
    >
      <p className="mb-1 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        Advertisement
      </p>
      <div
        ref={containerRef}
        className="flex min-h-[50px] md:min-h-[90px] items-center justify-center overflow-hidden"
      />
    </aside>
  );
}


