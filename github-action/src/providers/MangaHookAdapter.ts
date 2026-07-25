// ============================================================
// MangaHookAdapter — Fallback manga provider (Phase 2)
// API base URL set via MANGAHOOK_API_BASE_URL env variable.
// Activated by ProviderOrchestrator when FireFly fails (AD-001).
//
// Expected MangaHook API response shapes:
//
// GET /manga/latest-updates?page=1
// → { mangaList: [{ mangaId, mangaName, coverImage, authors, status }] }
//
// GET /chapter-list/:mangaId
// → { chapterList: [{ chapterId, chapterName, chapterNumber }] }
//
// GET /chapter-fetch/:chapterId
// → { chapterImages: [{ image }] }
// ============================================================

import { BaseAdapter } from './BaseAdapter.js';
import type { MangaDiscovery, ChapterDiscovery } from './MangaProvider.js';

interface MangaHookMangaItem {
  mangaId?: string;
  id?: string;
  mangaName?: string;
  title?: string;
  coverImage?: string;
  thumbnail?: string;
  authors?: string | string[];
  author?: string;
  genres?: string | string[];
  status?: string;
  description?: string;
}

interface MangaHookChapterItem {
  chapterId?: string;
  id?: string;
  chapterNumber?: number | string;
  number?: number | string;
  chapterName?: string;
  title?: string;
}

interface MangaHookImagesResponse {
  chapterImages?: Array<{ image?: string } | string>;
  images?: string[];
  data?: string[];
}

export class MangaHookAdapter extends BaseAdapter {
  readonly providerName = 'mangahook';

  private get baseUrl(): string {
    const url = process.env.MANGAHOOK_API_BASE_URL;
    if (!url) throw new Error('MANGAHOOK_API_BASE_URL is not set');
    return url.replace(/\/$/, '');
  }

  private parseGenres(raw?: string | string[]): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return raw.split(/[,;|]/).map((g) => g.trim()).filter(Boolean);
  }

  private parseChapterNumber(raw?: string | number): number {
    if (typeof raw === 'number') return raw;
    if (!raw) return 0;
    const match = String(raw).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  private normalizeStatus(raw?: string): 'ongoing' | 'completed' | 'hiatus' {
    const s = (raw ?? '').toLowerCase();
    if (s.includes('complet') || s === 'finished') return 'completed';
    if (s.includes('hiatus') || s.includes('pause') || s.includes('discontin')) return 'hiatus';
    return 'ongoing';
  }

  async fetchLatestManga(page: number): Promise<MangaDiscovery[]> {
    const res = await this.throttledFetch(`${this.baseUrl}/manga/latest-updates?page=${page}`);
    if (!res.ok) throw new Error(`MangaHook fetchLatestManga HTTP ${res.status}`);

    const data = await res.json() as { mangaList?: MangaHookMangaItem[]; data?: MangaHookMangaItem[]; results?: MangaHookMangaItem[] };
    const items: MangaHookMangaItem[] = data.mangaList ?? data.data ?? data.results ?? [];

    return items
      .filter((item) => item.mangaId ?? item.id)
      .map((item): MangaDiscovery => ({
        sourceId:       String(item.mangaId ?? item.id),
        sourceProvider: this.providerName,
        title:          item.mangaName ?? item.title ?? 'Untitled',
        coverUrl:       item.coverImage ?? item.thumbnail,
        genres:         this.normalizeGenres(this.parseGenres(item.genres)),
        author:         Array.isArray(item.authors)
                          ? item.authors.join(', ')
                          : (item.authors ?? item.author),
        status:         this.normalizeStatus(item.status),
        description:    item.description,
      }));
  }

  async fetchChapterList(mangaId: string): Promise<ChapterDiscovery[]> {
    const res = await this.throttledFetch(`${this.baseUrl}/chapter-list/${mangaId}`);
    if (!res.ok) throw new Error(`MangaHook fetchChapterList HTTP ${res.status} for manga ${mangaId}`);

    const data = await res.json() as { chapterList?: MangaHookChapterItem[]; data?: MangaHookChapterItem[] };
    const items: MangaHookChapterItem[] = data.chapterList ?? data.data ?? [];

    return items
      .filter((ch) => ch.chapterId ?? ch.id)
      .map((ch): ChapterDiscovery => ({
        sourceId:      String(ch.chapterId ?? ch.id),
        chapterNumber: this.parseChapterNumber(ch.chapterNumber ?? ch.number),
        title:         ch.chapterName ?? ch.title,
        sourceUrl:     `${this.baseUrl}/chapter-fetch/${ch.chapterId ?? ch.id}`,
      }));
  }

  async fetchChapterPages(chapterId: string): Promise<string[]> {
    const res = await this.throttledFetch(`${this.baseUrl}/chapter-fetch/${chapterId}`);
    if (!res.ok) throw new Error(`MangaHook fetchChapterPages HTTP ${res.status} for chapter ${chapterId}`);

    const data = await res.json() as MangaHookImagesResponse;

    // MangaHook may return images as array of objects or array of strings
    const rawImages = data.chapterImages ?? data.images ?? data.data ?? [];
    const images: string[] = rawImages.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null && 'image' in item) return item.image ?? '';
      return '';
    }).filter((url) => typeof url === 'string' && url.startsWith('http'));

    if (images.length === 0) {
      throw new Error(`MangaHook: No images found for chapter ${chapterId}`);
    }

    return images;
  }
}
