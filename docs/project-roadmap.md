# Project Roadmap
# Senpai Den — Giant-Killer Manga Platform

**Version:** 1.0.0  
**Total Phases:** 5  
**Estimated Timeline:** 10–14 weeks (solo developer pace)  
**Status:** Pre-Phase 1 (Scaffolding Complete)  

> All phases build sequentially. Do not start Phase N+1 until Phase N verification is complete.

---

## Phase 0: Foundation (Complete — This Document)
**Status:** ✅ Done  
**Output:** PRD.md, architecture.md, project-roadmap.md, .env.example, README.md  

---

## Phase 1: Database Foundation & Supabase Schema

### Objective
Establish the PostgreSQL schema in Supabase as the central source of truth for the entire platform. Every subsequent phase writes to or reads from this schema. Getting this right is non-negotiable — schema migrations mid-project are expensive.

### Tasks
- [ ] 1.1 Create Supabase project, note Project URL and anon/service keys
- [ ] 1.2 Enable `pg_trgm` extension in Supabase SQL editor
- [ ] 1.3 Create `manga` table with GIN indexes for full-text search
- [ ] 1.4 Create `chapters` table with all state machine columns (`job_status`, `content_freshness`, `last_served_at`, `retry_count`, `processing_started_at`)
- [ ] 1.5 Create `pages` table with `r2_keys TEXT[]` and `slice_dimensions JSONB` columns
- [ ] 1.6 Create `dead_letter_queue` table with `error_type`, `retry_count`, `max_retries`, `resolved`, `next_retry_at`
- [ ] 1.7 Create `error_log` table
- [ ] 1.8 Create `evict_old_chapter_images()` PostgreSQL function (PL/pgSQL)
- [ ] 1.9 Write and run seed script with 3 test manga entries + 5 chapters each (mix of QUEUED/READY/FAILED states)
- [ ] 1.10 Verify all foreign key constraints and ON DELETE CASCADE behaviors
- [ ] 1.11 Set up Row Level Security (RLS): public read on `manga` + `chapters` + `pages`; service role only for writes
- [ ] 1.12 Configure Supabase `updated_at` auto-trigger for all tables
- [ ] 1.13 Export schema SQL → save to `supabase/schema.sql` in repo

### AI Model Recommendation
> **Use: Gemini 3.1 Pro** (strong at SQL schema design, PL/pgSQL functions, and constraint modeling)  
> Prompt: *"Given this PRD state machine, write the complete Supabase schema SQL with all indexes, triggers, RLS policies, and the eviction function."*

### Skill Strategy
> No special skill needed. This is pure SQL/schema work. Use the model directly with the architecture.md as context.

### Dependencies
- None. This is the root dependency for all other phases.

### Verification
- [ ] Run seed script successfully with no constraint violations
- [ ] Query `manga` table by title using `ILIKE '%solo%'` and verify trgm index is used (`EXPLAIN ANALYZE`)
- [ ] Simulate all state machine transitions in SQL and verify no invalid states are reachable
- [ ] Confirm RLS blocks direct write from anon key, allows read

---

## Phase 2: Provider Adapters & GitHub Actions Scraper

### Objective
Build the discovery engine. This is the first moving part of the platform. By end of Phase 2, new manga chapters are automatically discovered hourly and inserted into Supabase as QUEUED jobs — without any human intervention.

### Tasks
- [ ] 2.1 Initialize `github-action/` Node.js project (`npm init`, TypeScript config, tsconfig.json)
- [ ] 2.2 Install dependencies: `@supabase/supabase-js`, `tsx`, `sharp` (for metadata only), `dotenv`
- [ ] 2.3 Create `src/providers/MangaProvider.ts` — interface definition
- [ ] 2.4 Create `src/providers/BaseAdapter.ts` — throttledFetch, UA rotation (5 UAs), 100 req/run cap, 2 req/s queue
- [ ] 2.5 Create `src/providers/FireFlyAdapter.ts` — implement `fetchLatestManga` and `fetchChapterPages`
- [ ] 2.6 Create `src/providers/MangaHookAdapter.ts` — implement same interface
- [ ] 2.7 Create `src/providers/ProviderOrchestrator.ts` — failover logic (FireFly → MangaHook → DLQ)
- [ ] 2.8 Create `scripts/scraper.ts` — main entry point: orchestrate discovery, upsert to Supabase
- [ ] 2.9 Create `scripts/evict.ts` — calls Supabase `evict_old_chapter_images()` RPC + R2 cleanup
- [ ] 2.10 Write `.github/workflows/scraper.yml` — hourly cron, secrets injection, `npx tsx scripts/scraper.ts`
- [ ] 2.11 Write `.github/workflows/evict-old-chapters.yml` — weekly Sunday 3AM cron
- [ ] 2.12 Add error handling: all adapter errors → insert `error_log` record via Supabase
- [ ] 2.13 Add DLQ insertion logic when both providers fail
- [ ] 2.14 Test locally with `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in `.env`
- [ ] 2.15 Add `src/providers/__tests__/` with unit tests for BaseAdapter throttle logic

### AI Model Recommendation
> **Use: Claude Sonnet 4.6 (Thinking)** (excellent at TypeScript provider patterns, async queue logic, and retry/backoff implementations)  
> Prompt: *"Implement the BaseAdapter class from this architecture document. It must enforce 2 req/s using a promise chain queue, not setInterval."*

### Skill Strategy
> No special skill. Use Claude Sonnet 4.6 (Thinking) directly with the `architecture.md` provider adapter section as context.

### Dependencies
- Phase 1 complete (Supabase schema must exist before inserting records)
- FireFly API key (from self-hosted instance or public endpoint)
- MangaHook API key

### Verification
- [ ] Run `npx tsx scripts/scraper.ts` locally — verify ≥1 manga upserted into Supabase
- [ ] Verify `chapters` records created with `job_status = 'QUEUED'`
- [ ] Kill FireFly env var, re-run — verify MangaHook fallback activates
- [ ] Kill both env vars, re-run — verify DLQ entry created, no crash
- [ ] Push to GitHub, trigger `workflow_dispatch`, confirm Actions run succeeds
- [ ] Confirm 100 req/run cap test: mock 150 URLs, verify only 100 are fetched

---

## Phase 3: Hugging Face Worker (Image Processing Pipeline)

### Objective
Build the brain of the platform. The HF worker is the only component that touches raw image data. By end of Phase 3, QUEUED chapters are automatically downloaded, sliced at 1500px, converted to WebP, uploaded to R2, and marked READY — without any human involvement.

### Tasks
- [ ] 3.1 Create Hugging Face Space (type: Docker or Gradio, Python or Node)
- [ ] 3.2 Initialize `hf-worker/` project: `package.json` (Node) or `requirements.txt` (Python)
- [ ] 3.3 Install deps: `sharp` (Node) or `Pillow` + `boto3` (Python), `@supabase/supabase-js` or `supabase-py`
- [ ] 3.4 Implement main poll loop: `SELECT ... WHERE job_status = 'QUEUED' ORDER BY created_at LIMIT 1`
- [ ] 3.5 Implement 5-minute timeout watchdog per job (check `processing_started_at`)
- [ ] 3.6 Implement `downloadImage(url)` with exponential backoff (3 retries)
- [ ] 3.7 Implement `sliceImage(buffer, height=1500)` → returns array of `{buffer, width, height}`
- [ ] 3.8 Implement `convertToWebP(buffer, quality=70)` → WebP buffer
- [ ] 3.9 Implement `uploadToR2(slices[], chapterId, pageNumber)` → returns `r2_keys[]`
- [ ] 3.10 Implement `updateSupabase(chapterId, pageId, r2Keys, sliceDimensions)` 
- [ ] 3.11 Implement R2 cleanup function `deleteR2Objects(r2Keys[])` for eviction
- [ ] 3.12 Implement DLQ insertion on processing failure (after 3 retries)
- [ ] 3.13 Implement `cleanupArchivedChapters()` — runs every 24 hours, deletes R2 objects for ARCHIVED chapters
- [ ] 3.14 Set HF Space environment secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- [ ] 3.15 Deploy to Hugging Face, verify Space starts without errors

### AI Model Recommendation
> **Use: Claude Sonnet 4.6 (Thinking) (via /ponytail skill)** — Excellent at file processing pipelines, binary buffer manipulation, and AWS S3-compatible R2 SDK usage  
> Prompt: *"Build the image slicing pipeline from this architecture doc. Handle the edge case where the final slice height is less than 1500px. Return slice_dimensions as [{width, height}] for each slice."*

### Skill Strategy
> **🎯 USE /ponytail HERE** — This is the most algorithmically complex single file in the project. The slicing logic, R2 upload batching, and 5-minute timeout watchdog all interact. /ponytail excels at this type of stateful, multi-step processing logic.

### Dependencies
- Phase 1 complete (Supabase schema)
- Phase 2 complete (QUEUED records must exist to process)
- Cloudflare R2 bucket created with public access enabled
- R2 API credentials generated (Account ID, Access Key ID, Secret)

### Verification
- [ ] Manually insert a test chapter record with `job_status = 'QUEUED'` and a real chapter URL
- [ ] Watch HF Space logs — confirm job picked up, images downloaded
- [ ] Confirm `pages` table populated with `r2_keys` and `slice_dimensions`
- [ ] Confirm `chapters.job_status` = `'READY'` after processing
- [ ] Load R2 public URL in browser — verify WebP image loads correctly
- [ ] Test 5-min timeout: set `processing_started_at` to 6 minutes ago, verify DLQ entry created
- [ ] Test with a 15,000px tall manhwa image — verify correct slice count and dimensions

---

## Phase 4: Cloudflare Edge Worker (API Gateway)

### Objective
Build the read-path intelligence layer. The Cloudflare Worker sits between the frontend and Supabase/R2. It handles all API calls, injects freshness headers, manages chapter status polling, and enforces cache control rules.

### Tasks
- [ ] 4.1 Initialize `cloudflare-worker/` with Wrangler CLI (`npx wrangler init`)
- [ ] 4.2 Configure `wrangler.toml`: worker name, routes, R2 binding, environment variables
- [ ] 4.3 Implement router (using itty-router or manual URL parsing)
- [ ] 4.4 Implement `GET /api/manga` — paginated manga list with search (`q` param → Supabase `ilike`)
- [ ] 4.5 Implement `GET /api/manga/:id` — manga detail + chapter list (ordered by chapter_number)
- [ ] 4.6 Implement `GET /api/chapter/:id` — pages with r2_keys, slice_dimensions; inject `X-Content-Freshness` header
- [ ] 4.7 Implement `GET /api/chapter/:id/status` — returns `{job_status, elapsed_seconds, content_freshness}`; if PROCESSING and elapsed > 300s → trigger DLQ insertion
- [ ] 4.8 Implement `POST /api/chapter/:id/read` — update `last_served_at` + increment `view_count`
- [ ] 4.9 Implement Cache-Control headers per endpoint (see architecture.md Section 3.6)
- [ ] 4.10 Add CORS headers for Next.js frontend domain
- [ ] 4.11 Add Cloudflare Worker secrets via `wrangler secret put` for all keys
- [ ] 4.12 Write Wrangler deploy script and confirm worker routes are correct
- [ ] 4.13 Test all endpoints with curl/Postman against production worker URL

### AI Model Recommendation
> **Use: Claude Sonnet 4.6 (Thinking) (via /ponytail skill)** — Strong at Cloudflare Workers API, itty-router patterns, and edge caching strategy  
> Prompt: *"Implement the chapter status endpoint. It must calculate elapsed_seconds from processing_started_at, and if > 300s and status is PROCESSING, insert a DLQ record and update chapter status to FAILED."*

### Skill Strategy
> **🎯 USE /ponytail HERE** — Cloudflare Workers have a unique runtime (no Node.js builtins, no filesystem, V8 isolates). /ponytail has been trained on Workers-specific patterns and the wrangler.toml schema.

### Dependencies
- Phase 1 complete (Supabase schema)
- Phase 3 complete (R2 bucket must have actual images to test chapter endpoint)
- Cloudflare account with Workers enabled
- Supabase service role key (for server-side DB queries from Worker)

### Verification
- [ ] `curl https://your-worker.workers.dev/api/manga` returns JSON manga list
- [ ] `curl https://your-worker.workers.dev/api/chapter/{id}/status` returns correct status and elapsed
- [ ] Verify `X-Content-Freshness: fresh` header present on READY chapter response
- [ ] Change chapter `content_freshness` to `'stale'` in Supabase → verify header updates
- [ ] Verify Cache-Control headers match spec (use curl -I)
- [ ] Run Cloudflare Analytics — confirm requests being logged

---

## Phase 5: Next.js Frontend (The Product)

### Objective
Build the user-facing product. This is what users see, touch, and judge the platform by. Priority is a fast, crash-free, beautiful mobile reading experience. Desktop is secondary.

### Tasks

**5a — Setup & Design System**
- [ ] 5.1 Initialize Next.js 15 App Router project in `frontend/` (`npx create-next-app@15`)
- [ ] 5.2 Install: `shadcn/ui`, `lucide-react`, `next-themes` (dark mode), `swr` (for client-side data fetching)
- [ ] 5.3 Configure `next.config.js`: add Cloudflare Worker domain to `images.remotePatterns`, `NEXT_PUBLIC_API_URL` env var
- [ ] 5.4 Build design system: CSS variables for dark/light theme, typography scale, color palette
- [ ] 5.5 Create reusable components: `MangaCard`, `ChapterList`, `StaleBanner`, `ProcessingSpinner`, `ErrorBoundary`

**5b — Core Pages**
- [ ] 5.6 Build `app/page.tsx` — Homepage: trending manga grid, recently updated strip
- [x] 5.7 Build `app/search/page.tsx` — Search input + real-time results (debounced 300ms)
- [x] 5.8 Build `app/manga/[slug]/page.tsx` — Manga detail: cover, metadata, chapter list with status badges
- [x] 5.9 Build `app/manga/[slug]/[chapter]/page.tsx` — **MAIN READER**
  - Vertical scroll reader
  - `aspect-ratio` CSS from `slice_dimensions` (zero CLS)
  - `loading="eager"` for first 2 slices, `loading="lazy"` for rest
  - Stale banner conditional on `X-Content-Freshness` header
  - Progress save to localStorage (25/50/75/100% scroll milestones)
  - Prev/Next chapter navigation
- [x] 5.10 Build `app/manga/[slug]/[chapter]/processing/page.tsx` — Polling page (15s interval, 5-min hard redirect to error)
- [x] 5.11 Build `app/manga/[slug]/[chapter]/error/page.tsx` — Error fallback with retry CTA
- [x] 5.12 Build `app/admin/page.tsx` — Admin dashboard: DLQ table, job queue status, manual retry buttons, eviction trigger

**5c — Performance & SEO**
- [x] 5.13 Add `<meta>` tags and Open Graph for manga/chapter pages (for sharing)
- [x] 5.14 Implement `generateMetadata()` for dynamic SEO titles on manga pages
- [x] 5.15 Add `robots.txt` and `sitemap.xml` generation
- [x] 5.16 Run Lighthouse audit — target LCP <2.5s, CLS <0.1
- [x] 5.17 Deploy to Cloudflare Pages via OpenNext adapter, configure `NEXT_PUBLIC_API_URL` environment variable

### AI Model Recommendation
> **Homepage/Search/Manga Detail:** Use **Gemini 3.6 Flash** (fast iteration for UI scaffolding)  
> **Chapter Reader (5.9):** Use **Claude Sonnet 4.6 (Thinking)** — the reader is the most complex UI component (lazy loading, CLS prevention, scroll milestones, stale banner logic)  
> **Admin Dashboard (5.12):** Use **Gemini 3.1 Pro** (good at data tables, sorting, filtering UI)

### Skill Strategy
> **🎯 USE /ponytail for the Chapter Reader (Task 5.9)** — The reader involves multiple simultaneous concerns: `aspect-ratio` CSS, `IntersectionObserver` for scroll milestones, header-reading for stale state, and navigation. /ponytail handles multi-concern component design well.  
> **Regular prompting for everything else** using Claude Sonnet 4.6 (Thinking) (pages, components, design system).

### Dependencies
- Phase 4 complete (Cloudflare Worker endpoints must be live)
- Phase 3 complete (actual processed images must exist in R2 to test reader)
- Cloudflare Pages project linked to GitHub repository
- `NEXT_PUBLIC_API_URL` = Cloudflare Worker URL

### Verification
- [ ] Open manga detail page — verify chapter list loads with correct status badges
- [ ] Click a READY chapter — verify reader loads with correct images and no layout shift
- [ ] Click a QUEUED chapter — verify redirect to `/processing` page with spinner
- [ ] Wait 15 seconds on processing page — verify it polls and shows elapsed time
- [ ] Set `content_freshness = 'stale'` in Supabase — verify stale banner appears in reader
- [ ] Run Lighthouse on chapter reader — LCP <2.5s, CLS <0.1
- [ ] Test on mobile Chrome (Android emulation) — verify no OOM crash on 20+ page manhwa chapter
- [ ] Verify admin dashboard shows DLQ entries and manual retry works

---

## Cross-Phase Non-Negotiables

These apply to every phase:

| Rule | Description |
|---|---|
| **Never commit secrets** | All keys go in `.env` (local) or GitHub/Cloudflare Pages secrets. `.env` is in `.gitignore`. |
| **State machine is immutable** | Do not add new `job_status` values without updating all consuming code and this roadmap |
| **Adapter interface is immutable** | `MangaProvider` interface must not change after Phase 2 ships |
| **R2 key format is immutable** | `manga/{chapter_id}/{page_number}_{slice_index}.webp` — changing this breaks all existing URLs |
| **slice_dimensions is canonical** | Never compute aspect ratios on the frontend; always read from Supabase `slice_dimensions` |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hugging Face Space suspended for ToS | Medium | Critical | Keep processed volumes low; read HF ToS carefully; have Render.com free tier as backup |
| Upstream manga sites change DOM/API | High | High | Provider adapter pattern means only the adapter file changes; DLQ keeps jobs safe |
| Supabase pauses project (7-day inactivity) | Low | High | Hourly scraper cron counts as activity; configure keep-alive ping |
| R2 bandwidth cap exceeded | Low | Medium | Cloudflare CDN serves from edge — R2 bandwidth is NOT charged for CDN requests |
| GitHub Actions minutes exhausted | Low | Medium | Reduce scrape frequency to 2-hourly if needed |
| FireFly/MangaHook APIs shut down | Medium | High | Adapter pattern + DLQ; platform keeps serving stale until new adapter is deployed |

---

*This roadmap is a living document. Update task checkboxes as work progresses.*
