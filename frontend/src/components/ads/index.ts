/**
 * SenpaiDen Centralized Ads & Monetization Module
 * ==============================================
 * All ad components, banner slots, popunder scripts, and interstitial units
 * are consolidated into this dedicated folder.
 * 
 * To enable/disable all ads platform-wide:
 * Modify `ADS_TEMPORARILY_DISABLED` in `@/lib/monetization.ts` or toggle `NEXT_PUBLIC_ADS_ENABLED`.
 */

export { AdSlot } from "./AdSlot";
export { VideoAdUnit, type VideoAdUnitProps } from "./VideoAdUnit";
export { StickyAnchorAd } from "./StickyAnchorAd";
export { InterstitialAdModal, type InterstitialAdModalProps } from "./InterstitialAdModal";
export { MonetizationProvider } from "./MonetizationProvider";

export {
  ADS_TEMPORARILY_DISABLED,
  ADS_ENABLED,
  ADS_PREVIEW,
  canServeAdsInBrowser,
  type AdPlacement,
} from "@/lib/monetization";
