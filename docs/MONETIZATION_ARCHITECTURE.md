# SenpaiDen — Monetization & Ads Architecture (Growth Mode Quarantine)

## 1. Overview & Objective
During the initial launch and user acquisition phase ("Growth Mode"), user experience, high reading retention, and platform trust are paramount. Intrusive banners, popunders, locked chapter ad-walls, and commercial partnership landing pages deter organic readers.

To solve this, all ad-related files and components have been **quarantined into a dedicated, isolated folder** (`src/components/ads/`) and placed behind a single **Master Kill-Switch**. When disabled:
- **Zero ads, banners, or popunders** are loaded or rendered.
- **Zero third-party tracking scripts** (AdSense, Adsterra) are injected into the DOM.
- **Commercial pages** (`/partners`, `/affiliate-disclosure`, `/ads.txt`) are gated and return HTTP 404.
- **FastPass ad-gates** are disabled, allowing readers instant, uninterrupted access to all chapters.

---

## 2. Directory Structure (`frontend/src/components/ads/`)
All ad-related components are isolated in one place:

```
frontend/src/components/ads/
├── index.ts                   # Centralized barrel export & type re-exports
├── AdSlot.tsx                 # Responsive banner slot (Adsterra 728x90 desktop / 320x50 mobile)
├── VideoAdUnit.tsx            # High-CPM video ad sponsor container
├── StickyAnchorAd.tsx         # Viewport bottom sticky banner with collapse/close controls
├── InterstitialAdModal.tsx    # Timed countdown intermission partner modal
└── MonetizationProvider.tsx   # Global third-party ad script orchestrator (Adsterra & AdSense)
```

### Clean Module Imports
Application pages and layouts import directly from the unified module:
```typescript
import { AdSlot, VideoAdUnit, StickyAnchorAd, MonetizationProvider, ADS_ENABLED } from "@/components/ads";
```

For backward compatibility, bridge shims remain at `src/components/AdSlot.tsx` etc., re-exporting directly from `./ads/*`.

---

## 3. Centralized Master Kill-Switch
All ad behavior across the entire platform is controlled by a single switch in **`frontend/src/lib/monetization.ts`**:

```typescript
// Set to false when ready to turn ads back on in the future!
export const ADS_TEMPORARILY_DISABLED = true;

export const ADS_ENABLED = !ADS_TEMPORARILY_DISABLED && process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
export const ADS_PREVIEW = !ADS_TEMPORARILY_DISABLED && process.env.NEXT_PUBLIC_ADS_PREVIEW === "true";
```

### Component Short-Circuiting Behavior
When `ADS_TEMPORARILY_DISABLED` is `true`:
| Component | Behavior When Disabled |
|---|---|
| `AdSlot` | Immediately returns `null`. No iframe, no DOM elements, no listeners. |
| `VideoAdUnit` | Immediately returns `null`. No video canvas or sponsor cards. |
| `StickyAnchorAd` | Immediately returns `null`. Bottom viewport is 100% clean. |
| `InterstitialAdModal` | Immediately returns `null`. No modals or countdown timers. |
| `MonetizationProvider` | Immediately cleans up existing script tags and returns `null`. |

---

## 4. Platform-Wide Growth Mode Changes

### A. Commercial Pages & SEO Gating
1. **`/partners`**: Returns Next.js `notFound()` (404 page).
2. **`/affiliate-disclosure`**: Returns Next.js `notFound()` (404 page).
3. **`/ads.txt`**: Returns HTTP 404 (`Ad inventory is not active.`).
4. **`sitemap.xml`**: Dynamically excludes `/partners` and `/affiliate-disclosure`.
5. **Footer Navigation (`SiteLayout.tsx`)**: "Partners" and "Affiliate disclosure" links are hidden.

### B. Layout Padding & Margin Cleanup
In all page feeds (`Home`, `Discover`, `Search`, `Library`, `History`, `Notifications`, `Manga Detail`, and `Manga Reader`), ad container wrapper divs check `{ADS_ENABLED && (...)}`. This eliminates empty gaps, stray borders, and blank spaces when ads are disabled.

### C. FastPass Early-Access Unlocked for All
In `src/lib/fastpass.ts`:
```typescript
export function isChapterFastPass(chapterNumber: number, latestChapter: number, totalChapters: number): boolean {
  if (!ADS_ENABLED) return false;
  // ...
}
```
Because `ADS_ENABLED` is `false`, no chapter is locked behind a sponsor ad countdown. All chapters are instantly readable for free.

### D. Cookie Consent Privacy Choices
The cookie consent banner (`CookieConsent.tsx`):
- Removes the "Advertising" storage category checkbox.
- Updates consent copy to focus strictly on necessary storage and analytics.
- Never records `advertising: true` while ads are disabled.

---

## 5. How to Re-Enable Ads in the Future (1-Step Procedure)
When your website has grown its reader base and you are ready to turn ads back on:

### Step 1: Flip the Master Switch
In **`frontend/src/lib/monetization.ts`**, change line 3:
```typescript
export const ADS_TEMPORARILY_DISABLED = false;
```

### Step 2: Update Environment Variables
In **`frontend/.env`**:
```env
NEXT_PUBLIC_ADS_ENABLED=true
NEXT_PUBLIC_ADS_PLACEMENT_HOME=true
NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER=true
NEXT_PUBLIC_ADS_PLACEMENT_DETAIL=true
NEXT_PUBLIC_ADS_PLACEMENT_READER_TOP=false
NEXT_PUBLIC_ADS_PLACEMENT_READER_BOTTOM=true
NEXT_PUBLIC_ADS_PLACEMENT_LIBRARY=true
NEXT_PUBLIC_ADS_PLACEMENT_HISTORY=true
NEXT_PUBLIC_ADS_PLACEMENT_NOTIFICATIONS=true
NEXT_PUBLIC_ADS_PLACEMENT_DISCOVER_BOTTOM=true
```

**That's it!** You do not need to edit any individual page files. All components in `src/components/ads/`, partner pages, footer links, and sitemap entries will automatically restore themselves.
