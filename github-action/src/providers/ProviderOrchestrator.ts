// ============================================================
// ProviderOrchestrator — Primary & Fallback Ingestion Orchestrator
// Strategy: MangaPill first → MangaDex on failure → DLQ on both failure
// ============================================================

import type { MangaProvider, MangaDiscovery, ChapterDiscovery } from './MangaProvider.js';
import { MangaPillAdapter } from './MangaPillAdapter.js';
import { MangaDexAdapter } from './MangaDexAdapter.js';

export class ProviderOrchestrator {
  private providers: MangaProvider[];

  constructor(customProviders?: MangaProvider[]) {
    this.providers = customProviders ?? [new MangaPillAdapter(), new MangaDexAdapter()];
  }

  async discoverLatestManga(page: number = 1): Promise<MangaDiscovery[]> {
    for (const provider of this.providers) {
      try {
        console.log(`[Orchestrator] Fetching latest manga via ${provider.providerName}...`);
        const results = await provider.fetchLatestManga(page);
        if (results.length > 0) return results;
      } catch (err: any) {
        console.warn(`[Orchestrator] Provider '${provider.providerName}' failed latest fetch: ${err.message}`);
      }
    }
    throw new Error('[Orchestrator] All providers failed to fetch latest manga');
  }

  async discoverChapters(mangaId: string): Promise<ChapterDiscovery[]> {
    for (const provider of this.providers) {
      try {
        const chapters = await provider.fetchChapterList(mangaId);
        if (chapters.length > 0) return chapters;
      } catch (err: any) {
        console.warn(`[Orchestrator] Provider '${provider.providerName}' failed chapter list for ${mangaId}: ${err.message}`);
      }
    }
    throw new Error(`[Orchestrator] All providers failed to fetch chapters for ${mangaId}`);
  }

  async discoverPages(chapterId: string): Promise<string[]> {
    for (const provider of this.providers) {
      try {
        const pages = await provider.fetchChapterPages(chapterId);
        if (pages.length > 0) return pages;
      } catch (err: any) {
        console.warn(`[Orchestrator] Provider '${provider.providerName}' failed chapter pages for ${chapterId}: ${err.message}`);
      }
    }
    throw new Error(`[Orchestrator] All providers failed to fetch pages for chapter ${chapterId}`);
  }
}
