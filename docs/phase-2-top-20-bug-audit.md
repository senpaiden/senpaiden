# Phase 2 — Top 20 Bug Audit

**Captured:** 2026-08-14  
**Method:** Static control-flow/data-flow audit, Phase 1 build/type/lint results, historical logs  
**Change policy:** This report does not modify authentication, payments, production data, API contracts or reader behavior.

## Confidence labels

- **Confirmed:** The failure follows directly from the current code and does not require deployment-specific assumptions.
- **High confidence:** The defect is present, but impact/reproduction depends on runtime concurrency or platform topology.
- **Runtime verification:** Evidence is strong; staging reproduction is required before implementation.

## Ranked findings

### 1. Browser storage is treated as an authenticated session

- **Severity:** P0 — Critical
- **Confidence:** Confirmed
- **Evidence:** `frontend/src/lib/auth-storage.ts:16-18`, `frontend/src/app/login/page.tsx:47-54`
- **Failure:** `isSignedIn()` only checks whether two local-storage values exist. Any browser user can create those values and become “signed in” in the UI. OTP verification returns identity data, but the Supabase session/access token is not persisted or validated on protected requests.
- **Required fix:** Use a server-verifiable Supabase session in secure cookies and enforce authorization server-side. Treat local storage only as a non-authoritative UI cache.
- **Acceptance test:** Manually setting `senpai_session_v1=active` must not grant an authenticated account or protected action.

### 2. Premium entitlement can be forged in local storage

- **Severity:** P0 — Critical
- **Confidence:** Confirmed
- **Evidence:** `frontend/src/app/premium/page.tsx:54-61`, `frontend/src/app/premium/page.tsx:108-111`
- **Failure:** Premium status and expiry are read directly from `senpai_premium`. A user can write an arbitrary future expiry and receive client-enforced Premium/ad-free behavior.
- **Required fix:** Persist entitlement server-side against an authenticated user and return signed/server-validated membership state.
- **Acceptance test:** Editing or deleting browser storage must neither grant nor permanently remove the server-side entitlement.

### 3. Verified payment is not bound to a user or persisted server-side

- **Severity:** P0 — Critical
- **Confidence:** Confirmed
- **Evidence:** `frontend/src/app/api/razorpay/verify/route.ts:54-62`, `frontend/src/app/premium/page.tsx:108`
- **Failure:** The verify route validates Razorpay data, then only returns an expiry timestamp. No user identity is required and no membership/payment record is written. Entitlement is therefore device-local and cannot be reliably revoked, restored or audited.
- **Required fix:** Require authenticated user, store provider payment/order identifiers idempotently, and create/update entitlement in one server-side transaction.
- **Acceptance test:** Replaying the same payment cannot create multiple extensions; the purchaser can restore Premium on another device.

### 4. Payment-order creation lacks authentication and rate limiting

- **Severity:** P0 — Critical
- **Confidence:** Confirmed
- **Evidence:** `frontend/src/app/api/razorpay/order/route.ts:7-37`
- **Failure:** Anyone can repeatedly create Razorpay orders. This enables resource abuse, noisy provider records and avoidable external API traffic.
- **Required fix:** Require authenticated account, durable distributed rate limit and idempotency key.
- **Acceptance test:** Anonymous calls fail; duplicate idempotency key returns the same order; burst threshold returns 429.

### 5. OTP rate limits are instance-local and client-IP input is spoofable

- **Severity:** P0 — Critical
- **Confidence:** High confidence
- **Evidence:** `frontend/src/lib/rate-limit.ts:1-20`
- **Failure:** Limits live in an in-memory Map, so they reset on restart and are not shared across serverless instances. `x-forwarded-for` is preferred without a trusted-proxy boundary, allowing direct clients to rotate the key in some deployments.
- **Required fix:** Use a platform/distributed limiter and derive identity from a trusted edge header or normalized platform request metadata.
- **Acceptance test:** Limit remains enforced across instances/restarts and cannot be bypassed with a supplied forwarding header.

### 6. Reader processing redirect is converted into a 404

- **Severity:** P0 — Critical
- **Confidence:** Confirmed
- **Evidence:** `frontend/src/app/manga/[id]/[chapter]/page.tsx:18-22`, `frontend/src/app/manga/[id]/[chapter]/page.tsx:67-69`
- **Failure:** Next.js `redirect()` works by throwing a framework control-flow exception. The surrounding broad `catch` catches it and calls `notFound()`, so a non-ready chapter can render a 404 instead of the processing page.
- **Required fix:** Do not catch framework navigation exceptions; narrow the try/catch to network/parsing work or rethrow recognized Next.js control flow.
- **Acceptance test:** A QUEUED/PROCESSING chapter always navigates to `/processing`, never 404.

### 7. Reader turns all API/parsing failures into “not found”

- **Severity:** P1 — High
- **Confidence:** Confirmed
- **Evidence:** `frontend/src/app/manga/[id]/[chapter]/page.tsx:13-69`
- **Failure:** Timeout, malformed slice JSON, missing dimensions and upstream 500 all become a 404. This hides outages, prevents retries and produces incorrect SEO/user messaging.
- **Required fix:** Distinguish 404, not-ready, transient upstream failure and corrupt content; add route error UI.
- **Acceptance test:** API 500 shows recoverable error; only a genuine absent manga/chapter produces 404.

### 8. Compound chapter endpoint silently ignores database errors

- **Severity:** P1 — High
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:198-206`, `cloudflare-worker/src/index.ts:215-236`
- **Failure:** `chapterCandidatesResult.error`, `pagesResult.error` and `chaptersResult.error` are not handled. Some query failures become false 404s or HTTP 200 responses with empty pages/navigation.
- **Required fix:** Check every query result and return a structured 5xx with correlation ID; never cache partial error data.
- **Acceptance test:** Forced pages-query failure returns 5xx and cannot produce an empty successful chapter.

### 9. Public status polling performs privileged, non-idempotent writes

- **Severity:** P1 — High
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:288-324`
- **Failure:** An unauthenticated GET uses the service-role client, updates chapter state and inserts into the DLQ. GET is no longer safe/read-only and can be triggered by crawlers, prefetchers or arbitrary clients.
- **Required fix:** Move watchdog transitions to a scheduled/background worker and make the public endpoint anon/read-only.
- **Acceptance test:** Repeated status GETs never change database state.

### 10. Concurrent status polls can create duplicate DLQ events

- **Severity:** P1 — High
- **Confidence:** High confidence
- **Evidence:** `cloudflare-worker/src/index.ts:303-323`
- **Failure:** Multiple requests can observe PROCESSING, independently update FAILED and insert identical timeout records. There is no conditional update, transaction or uniqueness guard.
- **Required fix:** Single conditional RPC/transaction plus unique incident key or idempotency constraint.
- **Acceptance test:** Fifty concurrent timeout checks create exactly one state transition and one DLQ item.

### 11. Read-tracking endpoint is unauthenticated privileged write traffic

- **Severity:** P1 — High
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:341-358`, `frontend/src/app/manga/[id]/[chapter]/page.tsx:30`
- **Failure:** Any caller can repeatedly write `last_served_at` for arbitrary valid chapter IDs. Reader rendering triggers the write without awaiting a durable event pipeline.
- **Required fix:** Use an authenticated/abuse-controlled analytics event or batched queue; limit updates per chapter/time window.
- **Acceptance test:** Anonymous bursts cannot cause unbounded database writes or indefinitely prevent eviction.

### 12. Read-tracking reports success when the update fails

- **Severity:** P1 — High
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:354-367`
- **Failure:** The update result is ignored and `{ success: true }` is always returned after the initial lookup.
- **Required fix:** Check update errors/affected rows and return an appropriate failure or enqueue acknowledgement.
- **Acceptance test:** A denied/failed update never returns success.

### 13. Worker KV rate limiter loses increments under concurrency

- **Severity:** P1 — High
- **Confidence:** High confidence
- **Evidence:** `cloudflare-worker/src/index.ts:30-36`
- **Failure:** Separate KV read and write operations are not atomic. Concurrent requests can read the same value and overwrite one another, making the advertised 60/min limit inaccurate.
- **Required fix:** Use Cloudflare's rate-limit binding for abuse protection or a serialized Durable Object when strict accounting is required.
- **Acceptance test:** A controlled burst has bounded overshoot consistent with the chosen limiter contract.

### 14. Missing IP collapses unrelated users into one rate-limit bucket

- **Severity:** P1 — High
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:32-36`
- **Failure:** Requests without `CF-Connecting-IP` share `rl:unknown:<minute>`. Local tests, non-Cloudflare routing or misconfiguration can make one user block everyone.
- **Required fix:** Fail configuration health checks outside Cloudflare or use an explicitly trusted fallback identity.
- **Acceptance test:** Missing edge identity does not create a global shared-user denial of service.

### 15. Pagination accepts invalid/negative page values

- **Severity:** P1 — High
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:68-76`
- **Failure:** `page=0`, negative values and non-numeric input are not validated, producing negative/NaN offsets and database errors that surface as 500 responses.
- **Required fix:** Parse with strict finite integer validation and clamp/reject outside the supported range.
- **Acceptance test:** Invalid page values consistently return a documented 400; extreme values cannot create expensive queries.

### 16. API ignores the caller's requested list limit

- **Severity:** P2 — Medium
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:68-70`, `frontend/src/app/page.tsx` and manga-detail fallback requests use `limit=20`/`limit=6`
- **Failure:** The Worker always uses 24, so payload size and UI expectations diverge. The related-manga fallback requests six but receives up to 24 before slicing.
- **Required fix:** Implement validated min/max limit or remove the unsupported public parameter everywhere.
- **Acceptance test:** Response metadata and returned item count follow the documented limit.

### 17. Mutable chapter JSON receives one-year immutable browser caching

- **Severity:** P1 — High
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:220-242`
- **Failure:** The response contains mutable manga metadata, the entire navigation list and available languages, but fresh content gets `max-age=31536000, immutable`. Corrections/new chapters can remain stale in browser caches for a year.
- **Required fix:** Separate immutable page-manifest data from mutable navigation/metadata, or use versioned manifest URLs and shorter shared-cache policy.
- **Acceptance test:** Publishing a new chapter updates navigation without waiting for browser cache expiry.

### 18. Three routes check cache but never populate it

- **Severity:** P2 — Medium
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:372-410`, `415-456`, `461-501`
- **Failure:** Recommendations, co-binged and catalogue-vectors call `cache.match()` but never `cache.put()`. Under the current explicit Cache API strategy, these lookups cannot hit entries created by the route itself.
- **Required fix:** Adopt one deliberate caching mechanism and test hit/miss headers; do not mix assumptions about browser/CDN/Cache API behavior.
- **Acceptance test:** Second identical request produces a verified cache hit and no database query.

### 19. Catalogue-vector fallback can hide a second database failure

- **Severity:** P2 — Medium
- **Confidence:** Confirmed
- **Evidence:** `cloudflare-worker/src/index.ts:469-482`
- **Failure:** When the vector query fails, the fallback query's error is ignored. A database outage can return HTTP 200 with an empty personalized catalogue.
- **Required fix:** Check fallback error and return structured 5xx; record which schema capability caused fallback.
- **Acceptance test:** Both queries failing produces 5xx, not an empty successful response.

### 20. Processing page can poll forever after lookup/API errors

- **Severity:** P2 — Medium
- **Confidence:** Confirmed
- **Evidence:** `frontend/src/app/manga/[id]/[chapter]/processing/page.tsx:10-35`
- **Failure:** Initial manga response status is not checked and errors are swallowed. If the chapter ID is absent or the request returns an error document, SWR never starts and the UI remains “Optimizing Images” indefinitely. The SWR fetcher also parses non-2xx JSON without throwing.
- **Required fix:** Validate both responses, expose retry/backoff/terminal timeout states and stop polling on terminal errors.
- **Acceptance test:** 404/429/500 and missing chapter ID each show a bounded recoverable or terminal state; no infinite spinner.

## Additional audit notes

These are important but ranked below the current Top 20: manga detail uses `select('*')`; excluded genre filters construct raw PostgREST syntax; full chapter navigation is unbounded; middleware accepts the admin key in a query parameter, which can leak through history/logs/referrers; and the Worker returns internal exception messages to public clients.

## Fix order

1. **Security boundary:** Findings 1–5.
2. **Reader correctness:** Findings 6–8 and 20.
3. **Privileged state transitions:** Findings 9–12.
4. **Edge/API correctness:** Findings 13–19.

## Phase exit status

The Top 20 static audit is complete. Findings involving concurrency, distributed rate limiting and deployed cache behavior still require staging reproductions before code changes. Payment, authentication and production database changes remain **RED / strictly locked** until their data model, migration, rollback and owner approval are defined.
