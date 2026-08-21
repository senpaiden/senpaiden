// ============================================================
// MangaDexAdapter — Official REST API Provider Adapter
// ============================================================

import { BaseAdapter } from './BaseAdapter.js';
import type { MangaDiscovery, ChapterDiscovery } from './MangaProvider.js';

export class MangaDexAdapter extends BaseAdapter {
  readonly providerName = 'mangadex';
  private readonly baseUrl = 'https://api.mangadex.org';

  async fetchLatestManga(page: number): Promise<MangaDiscovery[]> {
    const offset = (page - 1) * 20;
    const res = await this.throttledFetch(`${this.baseUrl}/manga?limit=20&offset=${offset}&includes[]=cover_art`);
    if (!res.ok) throw new Error(`MangaDex fetchLatestManga HTTP ${res.status}`);

    const body = await res.json() as { data?: Array<any> };
    const items = body.data ?? [];

    return items.map((item): MangaDiscovery => {
      const titleObj = item.attributes?.title ?? {};
      const title = titleObj.en ?? Object.values(titleObj)[0] ?? 'Untitled';
      const status = item.attributes?.status === 'completed' ? 'completed' : 'ongoing';

      return {
        sourceId: item.id,
        sourceProvider: this.providerName,
        title,
        status,
        description: item.attributes?.description?.en,
      };
    });
  }

  async fetchChapterList(mangaId: string): Promise<ChapterDiscovery[]> {
    const res = await this.throttledFetch(`${this.baseUrl}/manga/${mangaId}/feed?limit=500&translatedLanguage[]=en&order[chapter]=asc`);
    if (!res.ok) throw new Error(`MangaDex fetchChapterList HTTP ${res.status} for manga ${mangaId}`);

    const body = await res.json() as { data?: Array<any> };
    const items = body.data ?? [];

    return items.map((ch): ChapterDiscovery => {
      const chapterNumber = ch.attributes?.chapter ? parseFloat(ch.attributes.chapter) : 0;
      const title = ch.attributes?.title ?? `Chapter ${chapterNumber}`;

      return {
        sourceId: ch.id,
        chapterNumber,
        title,
        sourceUrl: `https://mangadex.org/chapter/${ch.id}`,
      };
    });
  }

  async fetchChapterPages(chapterUuid: string): Promise<string[]> {
    const res = await this.throttledFetch(`${this.baseUrl}/at-home/server/${chapterUuid}`);
    if (!res.ok) throw new Error(`MangaDex fetchChapterPages HTTP ${res.status} for chapter ${chapterUuid}`);

    const body = await res.json() as { baseUrl?: string; chapter?: { hash?: string; data?: string[] } };
    const host = body.baseUrl;
    const hash = body.chapter?.hash;
    const files = body.chapter?.data ?? [];

    if (!host || !hash || files.length === 0) {
      throw new Error(`MangaDex: No images found for chapter ${chapterUuid}`);
    }

    return files.map((f) => `${host}/data/${hash}/${f}`);
  }
}
