# System Architecture
# Senpai Den — Giant-Killer Manga Platform

**Version:** 1.0.0  
**Status:** Locked (Post /grill-me Session)  
**Last Updated:** 2026-07-24  

---

## 1. Architecture Philosophy

Senpai Den is built on a single guiding principle: **no synchronous dependency chain reaches the user**.

Every component that can fail (scrapers, image processors, upstream APIs) is decoupled from the read path via a persistent queue. Users always receive a response — either fresh content, stale content with an honest banner, or a lightweight polling page. A blank screen or 502 is architecturally impossible.

---

## 2. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          WRITE PATH (Async)                             │
│                                                                         │
│  ┌──────────────┐    QUEUED     ┌──────────────┐    PROCESSING         │
│  │ GitHub Action│──────────────▶│   Supabase   │──────────────────────▶│
│  │ (Scraper)    │               │  Job Queue   │                       │
│  │ Hourly Cron  │               │  + DB State  │                       │
│  └──────────────┘               └──────────────┘                       │
│         │                              │                                │
│         │  Provider Adapter            │  Hugging Face polls queue     │
│         ▼                              ▼                                │
│  ┌──────────────────┐        ┌─────────────────┐                       │
│  │  FireFlyAdapter  │        │  Hugging Face   │                       │
│  │  MangaHookAdapter│        │  Worker Space   │                       │
│  │  (BaseAdapter:   │        │  - Download img  │                       │
│  │   UA rotation,   │        │  - Slice 1500px  │                       │
│  │   2req/s,        │        │  - Convert WebP  │                       │
│  │   100req/run)    │        │  - Upload to R2  │                       │
│  └──────────────────┘        └─────────────────┘                       │
│                                        │                                │
│                                  READY ▼                                │
│                              ┌──────────────┐                           │
│                              │  Cloudflare  │                           │
│                              │     R2       │                           │
│                              │  (WebP imgs) │                           │
│                              └──────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          READ PATH (Sync)                               │
│                                                                         │
│  ┌──────────────┐  req    ┌──────────────────┐  fetch   ┌───────────┐  │
│  │   Next.js    │────────▶│  Cloudflare Edge  │─────────▶│    R2     │  │
│  │  Frontend    │         │     Worker        │          │  WebP imgs│  │
│  │  (CF Pages) │◀────────│  - Auth/Rate limit│◀─────────│           │  │
│  └──────────────┘  resp   │  - Freshness hdr  │  stream  └───────────┘  │
│                           │  - Status endpoint│                         │
│                           │  - Cache control  │                         │
│                           └──────────────────┘                         │
│                                    │                                    │
│                                    │ DB queries                         │
│                                    ▼                                    │
│                           ┌──────────────────┐                         │
│                           │    Supabase      │                         │
│                           │  PostgreSQL DB   │                         │
│                           │  - manga table   │                         │
│                           │  - chapters table│                         │
│                           │  - pages table   │                         │
│                           │  - jobs / DLQ    │                         │
│                           └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 GitHub Actions Scraper
**Runtime:** ubuntu-latest (2 vCPU, 7GB RAM ephemeral runner)  
**Trigger:** Hourly cron (`0 * * * *`) + manual `workflow_dispatch`  
**Role:** Discovery engine. Finds new manga/chapters and inserts QUEUED records into Supabase. Does NOT download images.

**Key Properties:**
- Fresh ephemeral IP per run → natural IP rotation against upstream source sites
- Calls `BaseAdapter.throttledFetch()` → enforced 2 req/s, 100 req/run cap
- Dual-provider failover: FireFly first, MangaHook on failure, DLQ on both failure
- Also runs the weekly eviction job (Sunday 3AM UTC)
- Supabase liveness: hourly scraper counts as "activity", preventing DB pause

**GitHub Actions Minutes Budget:**
```
Scraper:  720 runs/month × ~3 min/run = ~2,160 min    [within 2,000 limit at ~5 min]
Eviction: 4 runs/month × ~2 min/run   = ~8 min
Total:    ~768 min/month (38% of free 2,000 limit)
```
> **Note:** If scraper runtime regularly exceeds 5 minutes, reduce pages scraped per run.

---

### 3.2 Provider Adapter Layer
**Location:** `github-action/src/providers/`  
**Pattern:** Strategy Pattern + Abstract Base Class

```typescript
interface MangaProvider {
  fetchLatestManga(page: number): Promise<MangaDiscovery[]>;
  fetchChapterPages(chapterId: string): Promise<string[]>;
}

abstract class BaseAdapter implements MangaProvider {
  // Enforces: 2 req/s throttle, UA rotation (5 UAs), 100 req/run cap
  protected throttledFetch(url: string): Promise<Response>;
}

class FireFlyAdapter extends BaseAdapter { /* primary */ }
class MangaHookAdapter extends BaseAdapter { /* fallback */ }
```

**Failover Logic:**
```
1. Try FireFly → success → insert QUEUED record
2. FireFly 4xx/5xx → try MangaHook
3. MangaHook 4xx/5xx → log to error_log → insert DLQ record (PROVIDER_BLACKOUT)
4. For READY chapters: maintain content_freshness = 'stale', retry every 30min for 24hr
```

---

### 3.3 Supabase PostgreSQL — Database Schema

#### Tables

**`manga`**
```sql
CREATE TABLE manga (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       TEXT UNIQUE NOT NULL,       -- provider's internal ID
  source_provider TEXT NOT NULL,              -- 'firefly' | 'mangahook'
  title           TEXT NOT NULL,
  cover_url       TEXT,
  genres          TEXT[] DEFAULT '{}',
  author          TEXT,
  status          TEXT DEFAULT 'ongoing',     -- 'ongoing' | 'completed' | 'hiatus'
  description     TEXT,
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX manga_title_trgm_idx ON manga USING GIN (title gin_trgm_ops);
CREATE INDEX manga_genres_idx ON manga USING GIN (genres);
```

**`chapters`**
```sql
CREATE TABLE chapters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id          UUID REFERENCES manga(id) ON DELETE CASCADE,
  chapter_number    DECIMAL NOT NULL,
  title             TEXT,
  source_url        TEXT NOT NULL,            -- original scraper URL
  job_status        TEXT DEFAULT 'QUEUED',    -- state machine enum
  content_freshness TEXT DEFAULT 'fresh',     -- 'fresh' | 'stale' | 'archived'
  last_served_at    TIMESTAMPTZ,
  retry_count       INTEGER DEFAULT 0,
  error_message     TEXT,
  processing_started_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manga_id, chapter_number)
);

-- State machine: job_status valid values
-- DISCOVERED | QUEUED | PROCESSING | READY | FAILED | STALE_RETRY | ARCHIVED
-- See Section 4 for transition rules
```

**`pages`**
```sql
CREATE TABLE pages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id       UUID REFERENCES chapters(id) ON DELETE CASCADE,
  page_number      INTEGER NOT NULL,
  r2_keys          TEXT[] DEFAULT '{}',       -- ordered array of R2 object keys
  slice_dimensions JSONB DEFAULT '[]',        -- [{width, height}, ...] per slice
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, page_number)
);
```

**`dead_letter_queue`**
```sql
CREATE TABLE dead_letter_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id   UUID REFERENCES chapters(id),
  error_type   TEXT NOT NULL,    -- 'PROVIDER_BLACKOUT' | 'PROCESSING_TIMEOUT' | 'UPLOAD_FAILED'
  error_detail TEXT,
  retry_count  INTEGER DEFAULT 0,
  max_retries  INTEGER DEFAULT 3,
  resolved     BOOLEAN DEFAULT false,
  next_retry_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**`error_log`**
```sql
CREATE TABLE error_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT,            -- 'firefly' | 'mangahook' | 'hf_worker' | 'cf_worker'
  error_type   TEXT NOT NULL,
  error_detail TEXT,
  chapter_id   UUID REFERENCES chapters(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.4 Hugging Face Worker Space
**Runtime:** Python (FastAPI) or Node.js on HF Spaces free tier  
**RAM:** 16GB | **CPU:** 2 vCPU | **GPU:** Shared (NOT required for slicing)  
**Role:** Image processing pipeline. Polls Supabase for QUEUED chapters, downloads raw images, slices, converts to WebP, uploads to R2, updates status to READY.

**Processing Pipeline per Chapter:**
```
1. Poll Supabase → find oldest QUEUED chapter
2. Update status → PROCESSING, set processing_started_at = NOW()
3. For each page URL in chapter:
   a. Download raw image (PNG/JPG) with retry on 4xx
   b. Get image dimensions via sharp/Pillow
   c. If height > 1500px: slice into ceil(height/1500) segments
   d. Convert each slice to WebP @ 70% quality
   e. Upload slices to R2: key = manga/{chapter_id}/{page_number}_{slice_index}.webp
   f. Collect slice_dimensions: [{width, height}, ...]
4. Update pages table: r2_keys[], slice_dimensions JSONB
5. Update chapter: job_status = READY, content_freshness = 'fresh'
6. If any step fails after 3 retries: job_status = FAILED, insert into DLQ
7. If NOW() - processing_started_at > 5 minutes: force DLQ, status = FAILED
```

**Cold Start Handling:**
HF Spaces free tier may have 30–90s cold start. This is within the 5-minute cutoff. The polling page on the frontend accounts for this latency.

---

### 3.5 Cloudflare R2 Storage
**Storage:** 10GB free (8GB target)  
**Ops:** 1M Class-A (write) + 10M Class-B (read) ops/month free  
**CDN:** R2 Public Buckets serve via Cloudflare global CDN (free bandwidth)

**Key Structure:**
```
manga/{chapter_id}/{page_number}_{slice_index}.webp
Example: manga/a1b2c3/001_0.webp, manga/a1b2c3/001_1.webp
```

**Eviction:** R2 objects are deleted by the Hugging Face worker's cleanup job when chapters transition to ARCHIVED.

---

### 3.6 Cloudflare Edge Worker
**Runtime:** Cloudflare Workers (V8 isolates, <1ms cold start)  
**Requests:** 100K/day free tier  
**Role:** API gateway between Next.js frontend and Supabase/R2. Handles auth, caching, freshness headers, and the chapter status endpoint.

**Endpoints:**
```
GET  /api/manga?page=&search=      → Search/browse manga list
GET  /api/manga/{id}               → Manga detail + chapters list
GET  /api/chapter/{id}             → Chapter pages (r2_keys + slice_dimensions)
GET  /api/chapter/{id}/status      → Processing status + elapsed_seconds
POST /api/chapter/{id}/read        → Update last_served_at + view_count
```

**Freshness Header Injection:**
```typescript
// On every chapter response:
response.headers.set('X-Content-Freshness', chapter.content_freshness);
// Frontend reads this header and conditionally renders the stale banner
```

**Caching Strategy:**
```
/api/manga list      → Cache-Control: s-maxage=300 (5 min stale-while-revalidate)
/api/manga/{id}      → Cache-Control: s-maxage=60
/api/chapter/{id}    → Cache-Control: s-maxage=3600 (1 hour, immutable once READY)
/api/chapter/status  → Cache-Control: no-store (always fresh, polling endpoint)
```

---

### 3.7 Next.js Frontend
**Host:** Cloudflare Pages (free tier, via OpenNext adapter)  
**Framework:** Next.js 15 (App Router, React 19)  
**Key Routes:**

```
/                           → Homepage: trending + recent updates
/search?q=                  → Search results
/manga/[slug]               → Manga detail: cover, description, chapter list
/manga/[slug]/[chapter]     → Chapter reader (main product)
/manga/[slug]/[chapter]/processing → Processing polling page (15s interval)
/manga/[slug]/[chapter]/error      → Error fallback page
/admin                      → Admin dashboard: DLQ, job queue, eviction status
```

**Reader Architecture:**
- Infinite scroll, vertical strip layout (manhwa-optimized)
- `aspect-ratio` CSS reserved from `slice_dimensions` → CLS = 0
- First 2 slices: `loading="eager"`, remaining: `loading="lazy"`
- Progress saved to localStorage on 25%, 50%, 75%, 100% scroll milestones
- Stale banner rendered based on `X-Content-Freshness` response header

---

## 4. State Machine — Chapter Job Status

```
                    ┌─────────────────────────────────────────┐
                    │           State Transitions              │
                    └─────────────────────────────────────────┘

  [Scraper discovers new chapter]
           │
           ▼
     DISCOVERED ──► QUEUED ──────────────────────────────────────────────┐
                      │                                                   │
                      │ [HF Worker picks up job]                          │
                      ▼                                                   │
                  PROCESSING                                              │
                      │                                                   │
           ┌──────────┴──────────┐                                        │
           │                     │                                        │
      [Success]            [Failure / >5min]                             │
           │                     │                                        │
           ▼                     ▼                                        │
         READY               FAILED ──────────► DLQ ──► [Admin retry] ──┘
           │
           │ [Dual-provider blackout detected]
           ▼
      STALE_RETRY
           │
     ┌─────┴──────┐
     │             │
[Recovery       [>24 hours
 <24hrs]         elapses]
     │             │
     ▼             ▼
   READY        ARCHIVED
```

**Valid Transitions:**
```
DISCOVERED  → QUEUED
QUEUED      → PROCESSING
PROCESSING  → READY
PROCESSING  → FAILED
READY       → STALE_RETRY
STALE_RETRY → READY
STALE_RETRY → ARCHIVED
FAILED      → DLQ
DLQ         → QUEUED (admin-triggered retry)
READY       → ARCHIVED (eviction after 30 days)
```

---

## 5. Giant Platform Strategies Applied

### 5.1 Adapter Pattern — Provider Abstraction
Every upstream API is hidden behind `MangaProvider`. The system doesn't know or care which provider is active. Adding a third provider (e.g., MangaParkAdapter) is a single new file with zero risk to existing code.

### 5.2 Exponential Backoff — DLQ Retry
```
Retry 1: delay = 30s
Retry 2: delay = 30s × 2 = 60s
Retry 3: delay = 30s × 4 = 120s
Total:   210s (3.5 min, under 5-min processing cutoff)
Formula: delay = BASE_DELAY_MS × 2^(retry_count - 1)
```

### 5.3 Dead Letter Queue — No Lost Jobs
Every failed chapter processing attempt is recorded with:
- The failure reason (`error_type`)
- The error detail (stack trace / HTTP status)
- Retry count and `next_retry_at` timestamp
- Admin-resolvable via the `/admin` dashboard

### 5.4 Stale-While-Revalidate — CDN Philosophy
Borrowed directly from Cloudflare's CDN philosophy: serve stale cached data while the origin recovers. Applied at the application layer via `content_freshness` state and R2 cache persistence.

### 5.5 Ephemeral Execution — Scraper IP Rotation
GitHub Actions runners are destroyed after each run. Each run gets a fresh IP from Azure's datacenter pool. This is functionally equivalent to a rotating proxy service, at zero cost.

---

## 6. Free-Tier Capacity Limit Matrix

| Metric | Free Limit | Target Usage | Warning Threshold | Upgrade Action |
|---|---|---|---|---|
| Supabase DB Size | 500 MB | 300 MB | 450 MB | Accept Supabase Pro ($25/mo, 8GB) |
| Supabase Bandwidth | 5 GB/mo | 3 GB/mo | 4.5 GB/mo | Enable Cloudflare Worker caching |
| R2 Storage | 10 GB | 6 GB | 8 GB | Run eviction aggressively (14-day retention) |
| R2 Class-A Ops | 1M/mo | 500K/mo | 900K/mo | Batch R2 writes in worker |
| R2 Class-B Ops | 10M/mo | 5M/mo | 9M/mo | Increase CDN cache TTL |
| CF Workers Requests | 100K/day | 60K/day | 80K/day | Add SWR caching layer |
| HF Space RAM | 16 GB | 4 GB peak | 12 GB | Reduce concurrent image buffers |
| GitHub Actions | 2,000 min/mo | 768 min/mo | 1,800 min/mo | Reduce scrape frequency to 2-hourly |
| Cloudflare Pages BW | Unlimited | N/A | N/A | No upgrade needed |

---

## 7. Data Flow Narrative

### New Chapter Discovery Flow
```
1. GitHub Actions cron fires (hourly, fresh IP)
2. FireFlyAdapter.fetchLatestManga() called (throttled, 2 req/s)
3. New chapters inserted into Supabase: job_status = 'QUEUED'
4. If FireFly fails → MangaHookAdapter attempted
5. If both fail → error_log entry + DLQ entry (PROVIDER_BLACKOUT)
6. READY chapters: content_freshness → 'stale', retry scheduled
```

### Chapter Processing Flow
```
1. HF Worker polls Supabase: SELECT * FROM chapters WHERE job_status = 'QUEUED' LIMIT 1
2. Update: job_status = 'PROCESSING', processing_started_at = NOW()
3. Download page images (with backoff on failure)
4. For each image:
   a. Slice at 1500px intervals
   b. Convert to WebP 70% quality
   c. Upload slices to R2: manga/{chapter_id}/{page}_{slice}.webp
5. Insert pages records with r2_keys and slice_dimensions
6. Update chapter: job_status = 'READY', content_freshness = 'fresh'
7. If timeout (>5min) or failure: job_status = 'FAILED', insert DLQ entry
```

### Reader Request Flow
```
1. User navigates to /manga/[slug]/[chapter]
2. Next.js SSR fetches from Cloudflare Edge Worker
3. Worker queries Supabase: get chapter + pages with r2_keys + slice_dimensions
4. If job_status = 'PROCESSING': redirect to /processing page (15s polling)
5. If job_status = 'READY': stream R2 image URLs to frontend
6. Worker injects X-Content-Freshness header
7. Frontend renders images with aspect-ratio CSS (zero CLS)
8. Stale banner shown if header = 'stale' | 'archived'
9. Worker fires /api/chapter/{id}/read → update last_served_at
```

---

*This architecture document is locked for v1.0. Changes require explicit architecture review and PRD update.*
