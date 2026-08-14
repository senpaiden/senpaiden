# Phase 1 — Performance Baseline and Observability Audit

**Captured:** 2026-08-14  
**Scope:** Local production-mode frontend, repository validation, historical service logs  
**Capacity disclaimer:** These results are a repeatable local baseline, not proof of 10,000-user capacity or CDN performance.

## Executive result

The application builds and all TypeScript projects checked in this pass compile. The scraper adapter test suite passes. The frontend source lint gate fails with 32 errors and 58 warnings, while the production build currently skips lint and type validation. API-dependent production measurements are not yet representative because the Cloudflare Worker was unavailable during the run and its local configuration contains placeholder bindings.

## Validation baseline

| Check | Result | Evidence |
|---|---:|---|
| Frontend production build | Pass with caveat | 28 static/generated routes; lint and types skipped by build configuration |
| Frontend TypeScript | Pass | `tsc --noEmit` |
| Cloudflare Worker TypeScript | Pass | Worker typecheck script |
| Scraper/pipeline TypeScript | Pass | `tsc --noEmit` |
| Scraper adapter tests | Pass | 4/4 tests |
| Frontend source lint | Fail | 32 errors, 58 warnings |
| Full-stack local health | Blocked | Edge API not running/configured for representative local traffic |

## Frontend bundle baseline

| Route/group | First-load JavaScript |
|---|---:|
| Shared by all routes | 150 kB |
| Home | 135 kB |
| Manga detail | 136 kB |
| Reader | 159 kB |
| Processing page | 147 kB |
| Middleware | 39.3 kB |

## Local production-mode HTTP baseline

Twenty-five sequential requests were made per route against `next start` on the same machine.

| Route | Status | Average body | p50 | p95 | Max |
|---|---:|---:|---:|---:|---:|
| `/` | 25/25 HTTP 200 | 85,888 B | 22.5 ms | 37.0 ms | 294.4 ms |
| `/about` | 25/25 HTTP 200 | 43,973 B | 3.7 ms | 5.1 ms | 14.1 ms |
| `/discover` | 25/25 HTTP 200 | 96,983 B | 21.0 ms | 25.3 ms | 32.3 ms |
| `/search` | 25/25 HTTP 200 | 34,863 B | 4.9 ms | 8.0 ms | 9.9 ms |

### Local home-route concurrency probe

| Requests | Concurrency | Success | Throughput | p50 | p95 | Max |
|---:|---:|---:|---:|---:|---:|---:|
| 200 | 10 | 200/200 | 81.8 req/s | 117.3 ms | 175.0 ms | 179.5 ms |
| 200 | 50 | 200/200 | 87.5 req/s | 569.4 ms | 611.7 ms | 615.8 ms |

The throughput plateau and p95 increase at concurrency 50 are signals for later profiling, not production capacity conclusions. The test includes local server rendering/fallback behavior and excludes internet, CDN, Worker, database, R2 and real browser costs.

## Observability inventory

| Signal | Current state | Phase 1 action required |
|---|---|---|
| Browser Core Web Vitals | No field collector found | Add consent-aware LCP, INP and CLS collection |
| Frontend errors/traces | File logs only | Add structured request IDs and an error aggregation destination |
| Worker latency | No route-level histogram found | Record route, status, cache result and duration |
| Cache hit ratio | Not recorded | Emit hit/miss/bypass counters |
| Database query latency | Not captured in repo | Enable Supabase slow-query/query-performance review |
| R2 image delivery | Not captured | Record object bytes, status and cache outcome |
| Queue health | Logs exist | Add queued/processing/failed/DLQ counts and job age |
| Synthetic uptime | Not found | Add health checks for frontend, API and one known chapter |
| Load testing | No reusable harness found | Added `scripts/performance-baseline.mjs` for safe local baselines |

## Reliability findings from historical logs

1. Frontend catalogue requests repeatedly reached header timeout failures.
2. The HF worker repeatedly failed DNS resolution for an expired `trycloudflare.com` tunnel.
3. At least one provider returned an HTML reading page where API JSON was expected.
4. The production build attempted API fetches while the local edge API was unavailable and fell back after connection refusal.
5. Current logs are large free-form files without correlation IDs, latency fields or aggregate counters.

## Measurement targets for the production-like run

- Cached API p95 below 100 ms.
- Uncached read API p95 below 300 ms.
- Error rate below 0.1%.
- Edge/API cache hit ratio above 90% for catalogue and immutable chapter traffic.
- LCP p75 below 2.5 seconds, INP p75 below 200 ms, CLS p75 below 0.1.
- Reader navigation must complete without failed image/API requests in the defined test set.
- Queue oldest-job age, failure ratio and DLQ growth must have explicit alerts.

## Exit criteria still required

Phase 1 is locally baselined. A production-like baseline requires valid non-production Cloudflare/Supabase/R2 bindings, a known manga/chapter fixture, browser field/lab measurement, database query statistics and controlled remote load testing. Production load testing must not begin without an approved target, rate ceiling and rollback/stop conditions.

## Repeat command

Run the production frontend, then execute:

```powershell
node scripts/performance-baseline.mjs
```

Optional environment variables: `BASELINE_URL`, `BASELINE_PATHS`, `BASELINE_SEQUENTIAL_REQUESTS`, `BASELINE_LOAD_REQUESTS`, and `BASELINE_CONCURRENCY`.
