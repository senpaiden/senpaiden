# Product Requirements Document
# Senpai Den — The Giant-Killer Manga Platform

**Version:** 1.0.0  
**Status:** Locked (Post /grill-me Session)  
**Last Updated:** 2026-07-24  
**Author:** Architecture Review Board  

---

## 1. Executive Summary

Senpai Den is a free, mobile-first manga and manhwa reading platform engineered to survive the traffic spikes, API failures, and infrastructure costs that kill competitor products. It operates entirely on free-tier cloud infrastructure, uses a decoupled async job queue to prevent mobile crashes, and employs a provider adapter pattern to achieve zero single points of failure.

The platform is explicitly designed to outmaneuver "Giant" incumbents (MangaDex, MangaFire, Bato.to) not by matching their resources, but by being structurally superior — leaner, faster at the edge, and resilient where they are brittle.

---

## 2. The Core Problem

### 2.1 Problem Statement

Existing free manga platforms share a fatal architecture pattern:

```
User Request → Single API Provider → Direct Image Serve → Reader
```

This pattern fails in three catastrophic ways:

| Failure Mode | How Giants Fail | How Senpai Den Survives |
|---|---|---|
| **Traffic Spikes** | Origin servers buckle, 502s cascade | Cloudflare edge caches images globally; origin is never hit |
| **API Provider Outage** | Site goes down entirely | Stale cache served from R2; DLQ retries silently |
| **Mobile Crash Prevention** | 15,000px manhwa images OOM crash mobile WebViews | Hugging Face worker pre-slices to 1,500px before storage |

### 2.2 The Async Gap

No free-tier manga platform pre-processes images before serving them. They serve raw scraper URLs directly. This means:
- Images hosted on CDNs with rate limits and referrer checks
- Single scraped URLs break if the upstream renames files
- No image optimization; WebP conversion never happens

Senpai Den solves this by owning the image pipeline: scrape → process → store → serve.

---

## 3. Target Audience

### 3.1 Primary User
- **Age:** 16–32
- **Device:** Mobile-first (Android 80%, iOS 20%)
- **Behavior:** Reads 3–5 chapters per session, returns daily for updates
- **Pain Points:** Ads interrupting reading, slow chapter loads, apps crashing on long manhwa chapters, loss of reading progress

### 3.2 Secondary User
- **Power Reader:** Reads 10+ chapters, uses chapter-skip navigation, cares deeply about image quality
- **Offline Reader (Future):** Wants to cache chapters for offline transit reading

### 3.3 Excluded Audience (v1.0)
- Users requiring subtitle tracks or anime integration
- Users requiring account-based bookmarks synced across devices (reading progress is local-first in v1)

---

## 4. Core Features

### 4.1 Feature: Async Job Queue (P0 — Critical)
**What:** All chapter processing happens asynchronously via a Supabase-backed job queue. No synchronous processing on request.

**User Story:** As a reader, when I open a chapter that hasn't been processed yet, I see a progress indicator rather than a blank page or a crash.

**Acceptance Criteria:**
- [ ] Chapter status transitions through the defined state machine without manual intervention
- [ ] Processing page polls every 15 seconds via Cloudflare Edge Worker
- [ ] 5-minute hard cutoff moves stalled jobs to DLQ automatically
- [ ] DLQ entries are visible in the admin dashboard

**State Machine (Locked):**
```
DISCOVERED → QUEUED → PROCESSING → READY
READY → STALE_RETRY → READY          (provider recovery)
READY → STALE_RETRY → ARCHIVED       (24hr timeout)
QUEUED → FAILED → DLQ → QUEUED       (admin retry)
```

### 4.2 Feature: Manhwa Vertical Slicing (P0 — Critical)
**What:** Long-strip manhwa images (up to 50,000px tall) are sliced into 1,500px segments by the Hugging Face worker before storage.

**User Story:** As a mobile reader, I can scroll through manhwa chapters without my browser tab crashing due to memory limits.

**Acceptance Criteria:**
- [ ] All images taller than 1,500px are sliced into ≤1,500px segments
- [ ] Slice dimensions (width, height) are stored as `slice_dimensions` JSONB in Supabase
- [ ] Frontend uses `aspect-ratio` CSS from slice metadata to prevent Cumulative Layout Shift (CLS)
- [ ] Images are stored as WebP at 70% quality (original format discarded)
- [ ] The last slice of a chapter may be smaller than 1,500px (remainder handling)

**Technical Constraint (Locked):** Naive pixel-cut at 1,500px boundary. No content-aware panel detection in v1.0. Panel breaks mid-slice are acceptable.

### 4.3 Feature: Provider Adapter Pattern (P0 — Critical)
**What:** All manga data source integrations are implemented behind a common `MangaProvider` interface. Switching or adding providers requires zero architecture changes.

**Providers (v1.0):**
- `FireFlyAdapter` — Primary provider
- `MangaHookAdapter` — Secondary provider / failover

**User Story:** As the platform operator, when one scraping API breaks, I can deploy a new adapter without touching the job queue, worker, or frontend.

**Acceptance Criteria:**
- [ ] Both adapters implement `MangaProvider` interface (`fetchLatestManga`, `fetchChapterPages`)
- [ ] `BaseAdapter` enforces 2 req/s throttling and UA rotation across all providers
- [ ] Adapter errors are caught and logged to Supabase `error_log` table
- [ ] Provider failover is automatic: if FireFly fails, MangaHook is tried before DLQ

### 4.4 Feature: Stale Content Serving with Degraded UX Banner (P0 — Critical)
**What:** When both providers are unreachable, previously-processed chapters continue serving from R2 cache. A banner informs users of potential staleness.

**Freshness States (Locked):**
```sql
content_freshness: 'fresh' | 'stale' | 'archived'
```

| State | Banner | Retry Behavior |
|---|---|---|
| `fresh` | None | Normal |
| `stale` | "⚠️ This chapter may be outdated. We're retrying." | Every 30 min, max 24 hours |
| `archived` | "⚠️ This chapter is no longer being updated." | None |

**Acceptance Criteria:**
- [ ] Cloudflare Worker reads `content_freshness` and injects `X-Content-Freshness` response header
- [ ] Frontend reads header and conditionally renders banner
- [ ] DLQ entry created with `error_type = 'PROVIDER_BLACKOUT'` on dual-provider failure
- [ ] `last_served_at` column updated on every successful read

### 4.5 Feature: Full-Text Search (P1 — High Priority)
**What:** Users can search manga by title, genre, and author using Supabase's built-in pg_trgm full-text search.

**User Story:** As a reader, I can search "Solo Leveling" and get results in under 500ms.

**Acceptance Criteria:**
- [ ] `manga` table has a GIN index on `title` and `genres` columns
- [ ] Search endpoint returns results in <500ms for titles with >1000 entries
- [ ] Search is fuzzy (typo-tolerant via pg_trgm similarity matching)

### 4.6 Feature: Reading Progress (P1 — High Priority)
**What:** Reading progress is stored locally (localStorage) in v1.0, with Supabase sync gated behind a user account (v2.0).

**Acceptance Criteria:**
- [ ] Chapter and page position stored in localStorage on scroll milestone
- [ ] Resume reading CTA shows on manga detail page
- [ ] Progress eviction policy: cleared after 90 days of inactivity (client-side)

### 4.7 Feature: Image Eviction & Data Retention (P1 — High Priority)
**What:** Chapter images (R2 objects) and page records are evicted after 30 days of no reader access. Manga and chapter metadata is retained indefinitely.

**Eviction Logic (Locked):**
- Run weekly via GitHub Actions (Sunday 3AM UTC)
- 30-day default retention window
- Chapters in active `reading_progress` records are excluded from eviction
- Evicted chapters transition to `ARCHIVED` status; re-triggerable via admin

### 4.8 Feature: 3-Tier Hybrid Recommendation Engine (P1 — Core UX)
**What:** A 100% free, multi-layered recommendation system combining content embeddings, edge behavioral patterns, and client-side vector affinity scoring.

**Architecture Specification:**
- **Tier 1 (Detail Page - "More Like This"):** Supabase `pgvector` HNSW index querying Matryoshka-truncated 64-dim `halfvec` synopsis embeddings (<5ms SQL query).
- **Tier 2 (Reader Footer - "Readers Also Binged"):** Cloudflare Edge KV lookup of pre-computed Apriori association rules (<3ms Edge lookup). Read transitions buffered in-memory to respect Cloudflare KV 1,000 writes/day free limit.
- **Tier 3 (Homepage - "Recommended For You"):** Client-side Next.js pure JavaScript `Float32Array` dot-product against a lightweight 16-dim `client_vector` catalog array stored in `localStorage` (<1ms calculation, 0ms network roundtrip).

---

## 5. Non-Functional Requirements

### 5.1 Cost Constraint: 100% Free Tier

> **This is not a preference. This is a hard constraint.**

| Service | Free Tier Limit | Our Usage Target | Trigger to Upgrade |
|---|---|---|---|
| **Supabase** | 500MB DB, 5GB bandwidth | <400MB DB, <4GB BW | 450MB DB hit → accept Pro ($25/mo) |
| **Cloudflare R2** | 10GB storage, 1M ops/month | <8GB storage | 8GB hit → enable eviction aggressively |
| **Cloudflare Workers** | 100K req/day | <80K req/day | 80K/day → add caching layer |
| **Hugging Face Spaces** | 2 vCPU, 16GB RAM, shared GPU | 1 job at a time | Persistent queue > 100 items → upgrade |
| **GitHub Actions** | 2,000 min/month | ~720 min/month (scraper) | 1,800 min → reduce scrape frequency |
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/month | <500 builds/month | N/A (unlimited BW) |

### 5.2 Performance: Sub-Second Page Loads
- **First Contentful Paint (FCP):** <1.5s on 4G mobile
- **Largest Contentful Paint (LCP):** <2.5s
- **Cumulative Layout Shift (CLS):** <0.1 (enforced by `slice_dimensions` aspect-ratio reservation)
- **Time to Interactive (TTI):** <3.0s

### 5.3 Availability: Graceful Degradation Over Downtime
- Platform MUST serve content even when all upstream providers are down (stale serving)
- No hard-blocking error pages for content unavailability
- Admin dashboard accessible even during processing outages

### 5.4 Security: Zero IP Bans
- GitHub Actions ephemeral IPs provide natural rotation (fresh IP per run)
- UA rotation across 5 common browser fingerprints
- Hard cap of 100 requests per provider per GitHub Actions run
- Rate limit: 2 requests/second per provider (BaseAdapter-enforced)

### 5.5 Reliability: Processing Job SLA
- **Normal processing time:** 30–90 seconds (Hugging Face cold start included)
- **Hard cutoff:** 5 minutes — jobs exceeding this move to DLQ automatically
- **DLQ retry backoff:** 30s → 60s → 120s (max 3 retries, total ≤3.5 minutes)
- **Max retry attempts:** 3 before `FAILED` → permanent DLQ

---

## 6. Constraints & Explicitly Out-of-Scope (v1.0)

| Constraint | Rationale |
|---|---|
| No real-time updates (WebSocket/SSE) | Cloudflare Workers free tier doesn't support persistent connections reliably; Supabase Realtime requires paid plan for concurrent connections |
| No content-aware manhwa slicing | Adds 10–30s per chapter; too heavy for Hugging Face free tier in v1 |
| No user accounts in v1.0 | Auth adds complexity; reading progress is localStorage-first |
| No adult content | Legal and ToS risk on free hosting tiers |
| No video/anime content | Out of scope; static image pipeline only |
| No multi-language translation | ML translation pipeline is a separate product |

---

## 7. Locked Architecture Decisions (Post /grill-me)

These decisions are **immutable** for v1.0. Any change requires a full architecture review:

| Decision ID | Decision | Rationale |
|---|---|---|
| `AD-001` | Serve stale from R2 on dual-provider failure | User retention over correctness |
| `AD-002` | 15s polling page, 5-min cutoff, no WebSocket | Free tier compatibility |
| `AD-003` | 1500px naive pixel-cut, JSONB dimensions in Supabase | No ML overhead, single source of truth |
| `AD-004` | 30-day image eviction, metadata retained forever | Storage cost management |
| `AD-005` | Ephemeral IPs + UA rotation + 2 req/s + 100 req/run cap | Defense-in-depth against source site blocking |

---

*This PRD is the single source of truth for product decisions. All architecture, implementation, and UI decisions must be traceable to a requirement in this document.*
