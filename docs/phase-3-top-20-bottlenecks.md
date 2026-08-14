# Phase 3 — Top 20 Performance Bottlenecks

**Captured:** 2026-08-14  
**Scope:** Next.js frontend, Cloudflare Worker API, Supabase query patterns, reader image path and HF processing worker  
**Interpretation:** Static evidence and local measurements identify likely limits. Production impact must be confirmed with staging telemetry and query plans.

## Priority model

- **P0:** Can prevent the 10,000-user target or cause an outage/cost spike.
- **P1:** Material latency, bandwidth or scaling limitation.
- **P2:** Meaningful optimization after critical paths are controlled.

## Ranked bottlenecks

### 1. Every Worker request performs KV rate-limit I/O before cache lookup

- **Priority:** P0
- **Evidence:** `cloudflare-worker/src/index.ts:30-40`; route cache checks start later.
- **Impact:** Even a cache hit pays a KV read and write. At high traffic this adds latency, operations and cost before useful work.
- **Optimization:** Use Cloudflare's low-latency rate-limit binding, split policies by route and avoid write-heavy limiting for safe cached assets/GETs where appropriate.
- **Verify:** Worker p95/CPU and KV operations per request before/after; abuse policy must still pass burst tests.

### 2. Cache API strategy is regional and incomplete

- **Priority:** P0
- **Evidence:** Manual `caches.default` use throughout the Worker; three routes check cache without populating it.
- **Impact:** Cache API content does not replicate globally and `cache.put` is not Tiered Cache compatible. Cold locations can repeatedly hit Supabase.
- **Optimization:** Define a single CDN/Tiered Cache-compatible policy with normalized keys, versioned immutable manifests and explicit purge behavior.
- **Verify:** Cache hit ratio by location, origin requests per 1,000 user requests and cold-PoP p95.

### 3. Compound reader request makes four database queries

- **Priority:** P0
- **Evidence:** `cloudflare-worker/src/index.ts:189-224` performs manga + chapter candidate queries, then pages + all chapters.
- **Impact:** Reader startup is coupled to multiple PostgREST round trips. Pages and navigation are fetched sequentially after the first pair.
- **Optimization:** Narrow RPC/view returning the selected chapter manifest and compact adjacent navigation; fetch mutable navigation separately if necessary.
- **Verify:** Database round trips per reader open, Worker waiting time and uncached reader p95.

### 4. Every chapter open creates synchronous database write traffic

- **Priority:** P0
- **Evidence:** Reader calls `/read`; Worker performs chapter lookup plus update at `cloudflare-worker/src/index.ts:341-358`.
- **Impact:** A read-heavy platform turns each navigation into two privileged database operations, limiting throughput and increasing lock/WAL pressure.
- **Optimization:** Queue/batch read events, deduplicate by chapter/time bucket or update asynchronously at a controlled frequency.
- **Verify:** Writes per 1,000 chapter opens, database CPU/WAL and reader TTFB.

### 5. Status polling scales linearly with waiting users

- **Priority:** P0
- **Evidence:** Processing page polls every five seconds; each poll queries Supabase and may execute watchdog writes.
- **Impact:** 1,000 waiting users can generate roughly 200 status requests/second before retries/cache considerations.
- **Optimization:** Exponential backoff with jitter, push/realtime notification or shared edge status caching; move watchdog to background processing.
- **Verify:** Poll requests per waiting user, peak status RPS and time-to-ready.

### 6. Manga detail and reader return unbounded complete chapter lists

- **Priority:** P0
- **Evidence:** Chapter queries at `cloudflare-worker/src/index.ts:158-162` and `221-224` have no limit.
- **Impact:** Long-running series grow database work, JSON payload, server serialization, client parsing and chapter-selector DOM indefinitely.
- **Optimization:** Cursor pagination for detail; reader receives only previous/next plus a paged selector/search endpoint.
- **Verify:** Payload bytes and query time at 100, 500, 1,000 and 2,000 chapters.

### 7. Exact counts run on every catalogue miss

- **Priority:** P1
- **Evidence:** `/api/manga` requests `{ count: 'exact' }` for paginated/search/filter traffic.
- **Impact:** Count cost increases with catalogue/filter complexity and is repeated even when the UI may not need an exact total.
- **Optimization:** Remove exact count where unused, cache it, or use estimated/precomputed faceted counts.
- **Verify:** `EXPLAIN (ANALYZE, BUFFERS)`, database time and response field usage.

### 8. Search uses a leading and trailing wildcard

- **Priority:** P1
- **Evidence:** `.ilike('title', '%query%')` at Worker line 79.
- **Impact:** Trigram index can help, but short/common terms and combined filters may still be expensive; every unique search string also fragments the cache.
- **Optimization:** Minimum query length, normalized query, debouncing, prefix-first search and measured trigram/FTS plans.
- **Verify:** p95 query time by term length/cardinality and index hit/scan statistics.

### 9. Popularity ordering lacks a matching index

- **Priority:** P1
- **Evidence:** Co-binged fallback orders by `view_count DESC`; current performance migration has no `view_count` index.
- **Impact:** Popularity fallback can sort the manga table on each miss.
- **Optimization:** Add a measured partial/composite index or precomputed popular list; do not add indexes without query-plan evidence.
- **Verify:** Query plan, sort memory/time and index usage.

### 10. Manga detail fetches all columns

- **Priority:** P1
- **Evidence:** `.select('*')` at Worker line 152.
- **Impact:** Payload and serialization grow whenever schema gains embeddings, vectors or operational fields; response contract becomes uncontrolled.
- **Optimization:** Select an explicit public projection and separate internal/vector data.
- **Verify:** response bytes, database bytes returned and serialization time.

### 11. Catalogue-vector personalization downloads and scores up to 100 records in every browser

- **Priority:** P1
- **Evidence:** Worker lines 461-501 and `PersonalizedFeedRow.tsx:21-38`.
- **Impact:** Adds a client request, JSON parse, local-storage scan and client scoring after home hydration. Growth is capped at 100 but still duplicates work across users.
- **Optimization:** Precompute/cache lightweight recommendations at edge/server; load only when the row approaches viewport.
- **Verify:** transfer bytes, main-thread time, home INP/LCP and row engagement.

### 12. Shared first-load JavaScript is already 150 kB

- **Priority:** P1
- **Evidence:** Phase 1 production build; every route loads 150 kB shared JS, reader reaches 159 kB.
- **Impact:** Parse/compile/hydration cost affects all users, especially budget Android devices.
- **Optimization:** Bundle analysis, reduce global client boundary, dynamically load optional UI/ads/checkout and keep static layout server-rendered.
- **Verify:** compressed/uncompressed JS, main-thread execution and mobile Lighthouse/field INP.

### 13. Site-wide layout is a 499-line client component with many effects

- **Priority:** P1
- **Evidence:** `SiteLayout.tsx` has 499 lines, at least five effects, many state values/listeners and a loading overlay.
- **Impact:** Forces global hydration and broad rerenders for account, notification, reader-level, search, menu and intro state.
- **Optimization:** Server/static shell plus small isolated client islands and shared external stores with selective subscriptions.
- **Verify:** hydration duration, render counts and shared chunk reduction.

### 14. Intro video delays content and consumes over 1.1 MB

- **Priority:** P1
- **Evidence:** `public/loading-page.mp4` is 1,133,226 bytes, uses `preload="auto"`, and loading fallback can wait 4.5 seconds.
- **Impact:** First visit competes with critical resources and can intentionally hide useful content.
- **Optimization:** Remove the blocking intro or replace with a small poster/CSS animation; never preload it ahead of LCP resources.
- **Verify:** first-visit LCP, transferred bytes and content-visible time.

### 15. Large and duplicate static assets inflate repository/deployment and risk downloads

- **Priority:** P2
- **Evidence:** `hero.png` is 2.25 MB; loading video exists twice; banner and logo variants are duplicated across public/assets.
- **Impact:** Larger deploy artifacts, cache churn and accidental use of oversized originals.
- **Optimization:** Confirm references, retain one optimized canonical asset, generate responsive formats and delete only after dead-code verification.
- **Verify:** deployment size, asset request bytes and visual regression.

### 16. Reader remains a 778-line interactive monolith

- **Priority:** P1
- **Evidence:** `MangaReaderContainer.tsx` is 34,473 bytes with 11 state values, several effects/listeners, virtualization, preload, progression and modal logic.
- **Impact:** State updates can reevaluate a large subtree; optimization and correctness are difficult to isolate.
- **Optimization:** Split virtual strip, paged reader, HUD, progression and recommendation modal; memoize stable rows/controls after profiling.
- **Verify:** React render counts, commit duration, memory and scroll FPS.

### 17. Reader preloading is not network-adaptive

- **Priority:** P1
- **Evidence:** Hidden images preload approximately three to four upcoming slices; no Save-Data/effective-connection policy is present.
- **Impact:** Slow/mobile connections may spend bandwidth on unseen pages and compete with the current image.
- **Optimization:** Priority only for current/next slice; adaptive lookahead based on connection, direction, reading speed and memory pressure.
- **Verify:** wasted bytes, next-page wait and image error rate by connection class.

### 18. HF worker can process up to 24 pages concurrently across workers

- **Priority:** P1
- **Evidence:** Four worker loops by default and `pLimit(6)` pages per chapter; each download buffers the full response and image processing creates parallel work.
- **Impact:** Worst-case large source images can cause memory spikes, socket pressure and CPU contention on constrained hosting.
- **Optimization:** Global memory-aware concurrency, streaming/size caps, adaptive page concurrency and per-host connection limits.
- **Verify:** peak RSS, event-loop delay, job duration and failure rate under representative large chapters.

### 19. Multiple image transforms and uploads amplify each source page

- **Priority:** P2
- **Evidence:** Pages are sliced at 1,500 px; each slice is converted, blurhash-related work runs, and every slice is uploaded separately.
- **Impact:** Slicing protects browser memory but increases R2 object/request counts and reader HTTP request overhead.
- **Optimization:** Benchmark 1,500/2,000/3,000 px slice heights by device memory; tune WebP/AVIF quality and batch upload concurrency.
- **Verify:** objects and bytes per chapter, reader memory, image request p95 and visual quality score.

### 20. Local Phase 1 throughput plateaus while latency rises sharply

- **Priority:** P1
- **Evidence:** Home reached 81.8 req/s at concurrency 10 and 87.5 req/s at concurrency 50; p95 rose from 175 ms to 611.7 ms.
- **Impact:** Extra concurrency yielded little throughput and about 3.5× p95 latency in the local production-mode fallback path.
- **Optimization:** Profile server rendering/fallback data loading, cache route output and remove global hydration/loading work before interpreting capacity.
- **Verify:** CPU profile and repeated benchmark with full API, cache-warm/cold separation and fixed hardware.

## Optimization order

1. **Protect origins:** bottlenecks 1–6.
2. **Optimize database queries:** 7–10.
3. **Reduce browser work:** 11–17.
4. **Tune image pipeline:** 18–19.
5. **Repeat capacity test:** 20 using a production-like staging stack.

## Required production-like measurements

- Worker route/status/cache-result latency histograms.
- Supabase query plans and `pg_stat_statements` for the top read/write queries.
- Cache hit ratio and origin-request ratio by route and location.
- Reader manifest/chapter payload distribution.
- Images, objects and transferred bytes per chapter.
- Field Core Web Vitals segmented by device/network.
- HF worker peak memory, CPU, queue age and per-chapter processing time.

## Phase exit status

The static Top 20 bottleneck ranking is complete. No optimization has been implemented yet. Exact gains require staging telemetry and controlled load tests; production or third-party load testing remains prohibited without an approved rate ceiling and stop conditions.
