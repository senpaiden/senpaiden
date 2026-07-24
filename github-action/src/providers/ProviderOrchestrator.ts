// ============================================================
// ProviderOrchestrator — Failover logic (Phase 2)
// Strategy: FireFly first → MangaHook on failure → DLQ on both failure
// Architecture Decision: AD-001 (stale serving on dual-provider blackout)
// ============================================================

import { FireFlyAdapter } from './FireFlyAdapter.js';
import { MangaHookAdapter } from './MangaHookAdapter.js';
import type { MangaProvider, MangaDiscovery, ChapterDiscovery } from './MangaProvider.js';

export type OrchestratorResult<T> =
  | { success: true; data: T; provider: string }
  | { success: false; error: string; providerBlackout: boolean };

export class ProviderOrchestrator {
  private providers: MangaProvider[];

  constructor() {
    this.providers = [new FireFlyAdapter(), new MangaHookAdapter()];
  }

  /**
   * Attempts fetchLatestManga across all providers in order.
   * Returns first success. If all fail, returns providerBlackout: true.
   */
  async fetchLatestManga(page: number): Promise<OrchestratorResult<MangaDiscovery[]>> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        const data = await provider.fetchLatestManga(page);
        return { success: true, data, provider: provider.providerName };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[${provider.providerName}] ${msg}`);
        console.warn(`[Orchestrator] ${provider.providerName} fetchLatestManga failed, trying next...`);
      }
    }

    return { success: false, error: errors.join(' | '), providerBlackout: true };
  }

  /**
   * Attempts fetchChapterList across all providers in order.
   */
  async fetchChapterList(mangaId: string): Promise<OrchestratorResult<ChapterDiscovery[]>> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        const data = await provider.fetchChapterList(mangaId);
        return { success: true, data, provider: provider.providerName };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[${provider.providerName}] ${msg}`);
        console.warn(`[Orchestrator] ${provider.providerName} fetchChapterList failed for ${mangaId}, trying next...`);
      }
    }

    return { success: false, error: errors.join(' | '), providerBlackout: true };
  }

  /**
   * Attempts fetchChapterPages across all providers in order.
   */
  async fetchChapterPages(chapterId: string): Promise<OrchestratorResult<string[]>> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        const data = await provider.fetchChapterPages(chapterId);
        return { success: true, data, provider: provider.providerName };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[${provider.providerName}] ${msg}`);
        console.warn(`[Orchestrator] ${provider.providerName} fetchChapterPages failed for ${chapterId}, trying next...`);
      }
    }

    return { success: false, error: errors.join(' | '), providerBlackout: true };
  }
}
