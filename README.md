<div align="center">

# 🏯 Senpai Den

### The Giant-Killer Manga Platform

*Free. Fast. Unbreakable.*

[![Phase](https://img.shields.io/badge/Phase-0%20Complete-brightgreen)](docs/project-roadmap.md)
[![Architecture](https://img.shields.io/badge/Architecture-Locked-blue)](architecture.md)
[![PRD](https://img.shields.io/badge/PRD-v1.0.0-purple)](PRD.md)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

---

## What Is Senpai Den?

Senpai Den is a **free, mobile-first manga and manhwa reading platform** engineered to outperform incumbents by being structurally superior — not by matching their resources. It runs entirely on free-tier cloud infrastructure and is designed to survive the failure modes that kill competitor products:

| Problem | Giant Platform Failure | Senpai Den Solution |
|---|---|---|
| **Traffic Spikes** | Origin 502s cascade to users | Cloudflare edge serves cached images globally |
| **API Provider Outage** | Site goes down | Stale R2 cache served + silent DLQ retry |
| **Mobile OOM Crashes** | 15,000px manhwa images crash WebViews | HF worker pre-slices to 1,500px segments |
| **Single Point of Failure** | Provider goes down = platform down | Adapter pattern swaps providers without downtime |

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) on Cloudflare Pages | Free |
| **API Gateway** | Cloudflare Workers (Edge) | Free |
| **Database** | Supabase PostgreSQL | Free (500MB) |
| **Image Storage** | Cloudflare R2 | Free (10GB) |
| **Image Processor** | Hugging Face Spaces (Docker) | Free |
| **Scraper / CI** | GitHub Actions (Hourly Cron) | Free |
| **Provider 1** | FireFly Manga API (self-hosted) | Free |
| **Provider 2** | MangaHook API (fallback) | Free |

**Total Monthly Cost: $0.00** *(Upgrade trigger: Supabase DB hits 450MB → Supabase Pro at $25/mo)*

---

## Architecture Overview

```
GitHub Actions (Hourly)
    │ Provider Adapter (FireFly → MangaHook → DLQ)
    ▼
Supabase PostgreSQL (QUEUED)
    │ Hugging Face polls queue
    ▼
HF Worker: Download → Slice 1500px → WebP → R2 Upload
    │
    ▼
Cloudflare R2 (READY) ← served via Cloudflare CDN
    │
    ▼
Cloudflare Edge Worker (API Gateway + Freshness Headers)
    │
    ▼
Next.js Frontend (Cloudflare Pages) ← Mobile-first Reader
```

**Chapter State Machine:**
```
DISCOVERED → QUEUED → PROCESSING → READY
READY → STALE_RETRY → READY          (provider recovery)
READY → STALE_RETRY → ARCHIVED       (24hr timeout)
QUEUED → FAILED → DLQ → QUEUED       (admin retry)
```

→ Full architecture: [`architecture.md`](architecture.md)

---

## Project Documentation

| Document | Description |
|---|---|
| [`PRD.md`](PRD.md) | Product Requirements: features, NFRs, constraints, locked decisions |
| [`architecture.md`](architecture.md) | System design, DB schema, data flows, state machine |
| [`docs/project-roadmap.md`](docs/project-roadmap.md) | 5-phase implementation plan with AI model recommendations |
| [`.env.example`](.env.example) | All Environment Variables with source annotations |

## Local Development (Hybrid Architecture)

To run this platform locally without maxing out your machine's RAM, Senpai Den uses a **Hybrid Local Development** setup:

- **Database:** Runs in the cloud (Supabase) to save 4GB+ of local RAM.
- **Image Storage:** Runs locally via Docker (MinIO) to simulate Cloudflare R2.
- **APIs:** Mock Provider API replaces external scrapers to prevent IP bans during rapid development.

### How to Run Locally:
1. Start the Local S3 bucket (MinIO) and Mock Provider:
   ```bash
   docker compose up -d
   ```
2. Trigger the Scraper (finds new manga):
   ```bash
   npx tsx scripts/scraper.ts
   ```
3. Start the Image Processor (Hugging Face Worker):
   ```bash
   cd hf-worker && npm run start
   ```
4. Start the Edge API and Frontend:
   ```bash
   cd cloudflare-worker && npx wrangler dev
   cd frontend && npm run dev
   ```

---

## Repository Structure

```
senpai-den/
├── frontend/                  # Next.js 14 App Router (Phase 5)
│   ├── app/
│   │   ├── page.tsx           # Homepage
│   │   ├── search/
│   │   ├── manga/[slug]/
│   │   │   ├── page.tsx       # Manga detail
│   │   │   └── [chapter]/
│   │   │       ├── page.tsx   # Chapter reader
│   │   │       ├── processing/
│   │   │       └── error/
│   │   └── admin/             # DLQ + job queue dashboard
│   ├── components/
│   └── next.config.js
│
├── cloudflare-worker/         # Edge API Gateway (Phase 4)
│   ├── src/
│   │   └── index.ts           # Router + endpoints
│   └── wrangler.toml
│
├── hf-worker/                 # Image Processing Pipeline (Phase 3)
│   ├── src/
│   │   ├── index.ts           # Poll loop entry point
│   │   ├── imageProcessor.ts  # Slice + WebP conversion
│   │   └── r2Uploader.ts      # R2 upload + cleanup
│   └── Dockerfile
│
├── github-action/             # Scraper + Eviction (Phase 2)
│   ├── src/
│   │   └── providers/
│   │       ├── MangaProvider.ts      # Interface
│   │       ├── BaseAdapter.ts        # Throttle + UA rotation
│   │       ├── FireFlyAdapter.ts
│   │       └── MangaHookAdapter.ts
│   └── scripts/
│       ├── scraper.ts
│       └── evict.ts
│
├── supabase/
│   └── schema.sql             # Full DB schema (Phase 1 output)
│
├── .github/
│   └── workflows/
│       ├── scraper.yml        # Hourly scraper cron
│       └── evict-old-chapters.yml  # Weekly eviction
│
├── docs/
│   └── project-roadmap.md
│
├── PRD.md
├── architecture.md
├── .env.example
├── .gitignore
└── README.md
```

---

## Setup Instructions

> ⚠️ **Prerequisites:** The setup process follows the 5-phase roadmap. Do not skip phases.

### Phase 1 — Database Setup
1. Create a [Supabase](https://supabase.com) project
2. Copy `.env.example` → `.env`, fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
3. Run `supabase/schema.sql` in the Supabase SQL editor
4. Verify tables created: `manga`, `chapters`, `pages`, `dead_letter_queue`, `error_log`

### Phase 2 — Scraper
```bash
cd github-action
npm install
cp ../.env.example .env  # fill in provider keys
npx tsx scripts/scraper.ts
```

### Phase 3 — Hugging Face Worker
1. Create a [Hugging Face Space](https://huggingface.co/new-space) (Docker)
2. Set secrets in Space settings (see `.env.example` for the full list)
3. Push `hf-worker/` directory to the Space repository

### Phase 4 — Cloudflare Worker
```bash
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler deploy
```

### Phase 5 — Frontend
```bash
cd frontend
npm install
cp ../.env.example .env.local  # fill in NEXT_PUBLIC_API_URL
npm run dev
```

---

## Key Design Decisions

These decisions are **locked** for v1.0 and documented in the PRD:

| ID | Decision |
|---|---|
| `AD-001` | Serve stale R2 cache on dual-provider failure; never hard-block |
| `AD-002` | 15s polling page, 5-min hard cutoff, no WebSocket/SSE |
| `AD-003` | 1500px naive pixel-cut; `slice_dimensions` JSONB in Supabase (not R2 manifest) |
| `AD-004` | 30-day image eviction; chapter metadata retained forever |
| `AD-005` | Ephemeral GitHub Actions IPs + UA rotation + 2 req/s + 100 req/run |

---

## Contributing

This project is currently in solo-developer build phase (see [roadmap](docs/project-roadmap.md)).  
Issues and PRs will be enabled after Phase 3 is complete.

---

<div align="center">
Built with architectural obsession. No VC funding. No compromises.
</div>
# senpaiden
