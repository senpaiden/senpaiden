export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
export const ADS_PREVIEW = process.env.NEXT_PUBLIC_ADS_PREVIEW === "true";
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
export const ADSENSE_SLOT_HOME = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME || "";
export const ADSENSE_SLOT_DISCOVER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISCOVER || "";
export const ADSENSE_SLOT_DETAIL = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL || "";
export const ADSENSE_SLOT_LIBRARY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIBRARY || "";
export const ADSENSE_SLOT_HISTORY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HISTORY || "";
export const ADSENSE_SLOT_NOTIFICATIONS = process.env.NEXT_PUBLIC_ADSENSE_SLOT_NOTIFICATIONS || "";
export const ADSENSE_SLOT_DISCOVER_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISCOVER_BOTTOM || "";
export const AD_PLACEMENT_ENABLED: Record<AdPlacement, boolean> = {
  "home-feed": process.env.NEXT_PUBLIC_ADS_PLACEMENT_HOME === "true",
  "discover-grid": process.env.NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER === "true",
  "manga-detail": process.env.NEXT_PUBLIC_ADS_PLACEMENT_DETAIL === "true",
  "library-bottom": process.env.NEXT_PUBLIC_ADS_PLACEMENT_LIBRARY === "true",
  "history-bottom": process.env.NEXT_PUBLIC_ADS_PLACEMENT_HISTORY === "true",
  "notifications-bottom": process.env.NEXT_PUBLIC_ADS_PLACEMENT_NOTIFICATIONS === "true",
  "discover-bottom": process.env.NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER_BOTTOM === "true",
};

export type AdPlacement = "home-feed" | "discover-grid" | "manga-detail" | "library-bottom" | "history-bottom" | "notifications-bottom" | "discover-bottom";
export const AD_SLOT_BY_PLACEMENT: Record<AdPlacement, string> = {
  "home-feed": ADSENSE_SLOT_HOME,
  "discover-grid": ADSENSE_SLOT_DISCOVER,
  "manga-detail": ADSENSE_SLOT_DETAIL,
  "library-bottom": ADSENSE_SLOT_LIBRARY,
  "history-bottom": ADSENSE_SLOT_HISTORY,
  "notifications-bottom": ADSENSE_SLOT_NOTIFICATIONS,
  "discover-bottom": ADSENSE_SLOT_DISCOVER_BOTTOM,
};

export function canServeAdsInBrowser() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return false;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) return false;
  return true;
}
