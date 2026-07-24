// ============================================================
// BaseAdapter — Abstract base for all provider adapters (Phase 2)
// Enforces: 2 req/s throttle, UA rotation, 100 req/run hard cap
// Architecture Decision: AD-005
// ============================================================

import type { MangaProvider, MangaDiscovery, ChapterDiscovery } from './MangaProvider.js';

// Rotate through 5 common browser UAs to avoid fingerprinting
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
];



export abstract class BaseAdapter implements MangaProvider {
  abstract readonly providerName: string;

  // Promise chain queue enforces sequential, delayed requests
  private requestQueue: Promise<unknown> = Promise.resolve();
  private requestCount = 0;

  /**
   * Throttled fetch: enforces 2 req/s and 100 req/run limits.
   * Uses a promise chain (not setInterval) for precise serialization.
   */
  protected async throttledFetch(url: string): Promise<Response> {
    // Read lazily so tests can override process.env values per-test
    const maxRequests = parseInt(process.env.MAX_REQUESTS_PER_RUN ?? '100', 10);
    const delayMs    = parseInt(process.env.REQUEST_DELAY_MS    ?? '500', 10);

    if (this.requestCount >= maxRequests) {
      throw new Error(
        `[${this.providerName}] Rate limit hit: max ${maxRequests} requests per run reached.`
      );
    }

    const result = this.requestQueue.then(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));

      const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!;
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      this.requestCount++;
      console.log(`[${this.providerName}] Req ${this.requestCount}/${maxRequests}: ${url} → ${response.status}`);
      return response;
    });

    // Swallow errors in the chain so the queue doesn't stall
    this.requestQueue = result.then(() => undefined, () => undefined);
    return result as Promise<Response>;
  }

  // Abstract methods — implemented by concrete adapters
  abstract fetchLatestManga(page: number): Promise<MangaDiscovery[]>;
  abstract fetchChapterPages(chapterId: string): Promise<string[]>;
  abstract fetchChapterList(mangaId: string): Promise<ChapterDiscovery[]>;
}
