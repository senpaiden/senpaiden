// ============================================================
// FireFlyAdapter — Primary manga provider (Phase 2)
// API base URL is set via FIREFLY_API_BASE_URL env variable.
//
// Expected FireFly API response shapes:
//
// GET /api/manga/latest?page=1
// → { mangas: [{ id, title, thumbnail, author, genres, status, description }] }
//
// GET /api/manga/:id/chapters
// → { chapters: [{ id, chapter_number, title }] }
//
// GET /api/chapter/:id/images
// → { images: ["https://..."] }
// ============================================================

import { BaseAdapter } from './BaseAdapter.js';
import type { MangaDiscovery, ChapterDiscovery } from './MangaProvider.js';

interface FireFlyMangaItem {
  id?: string;
  manga_id?: string;
  title?: string;
  name?: string;
  thumbnail?: string;
  cover?: string;
  author?: string;
  authors?: string | string[];
  genres?: string | string[];
  status?: string;
  description?: string;
  summary?: string;
}

interface FireFlyChapterItem {
  id?: string;
  chapter_id?: string;
  chapter_number?: number | string;
  number?: number | string;
  title?: string;
  name?: string;
}

interface FireFlyImagesResponse {
  images?: string[];
  data?: string[];
  chapter?: { images?: string[] };
}

export class FireFlyAdapter extends BaseAdapter {
  readonly providerName = 'firefly';

  private get baseUrl(): string {
    const url = process.env.FIREFLY_API_BASE_URL;
    if (!url) throw new Error('FIREFLY_API_BASE_URL is not set');
    return url.replace(/\/$/, '');
  }

  // Normalize the messy real-world genre formats: "Action,Fantasy" or ["Action","Fantasy"]
  private parseGenres(raw?: string | string[]): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return raw.split(/[,;|]/).map((g) => g.trim()).filter(Boolean);
  }

  // Normalize chapter_number from string "Chapter 45" or number 45
  private parseChapterNumber(raw?: string | number): number {
    if (typeof raw === 'number') return raw;
    if (!raw) return 0;
    const match = String(raw).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  async fetchLatestManga(page: number): Promise<MangaDiscovery[]> {
    const res = await this.throttledFetch(`${this.baseUrl}/api/manga/latest?page=${page}`);
    if (!res.ok) throw new Error(`FireFly fetchLatestManga HTTP ${res.status}`);

    const data = await res.json() as { mangas?: FireFlyMangaItem[]; data?: FireFlyMangaItem[]; results?: FireFlyMangaItem[] };
    const items: FireFlyMangaItem[] = data.mangas ?? data.data ?? data.results ?? [];

    return items
      .filter((item) => item.id ?? item.manga_id)
      .map((item): MangaDiscovery => ({
        sourceId:       String(item.id ?? item.manga_id),
        sourceProvider: this.providerName,
        title:          item.title ?? item.name ?? 'Untitled',
        coverUrl:       item.thumbnail ?? item.cover,
        genres:         this.normalizeGenres(this.parseGenres(item.genres)),
        author:         Array.isArray(item.authors)
                          ? item.authors.join(', ')
                          : (item.authors ?? item.author),
        status:         this.normalizeStatus(item.status),
        description:    item.description ?? item.summary,
      }));
  }

  async fetchChapterList(mangaId: string): Promise<ChapterDiscovery[]> {
    const res = await this.throttledFetch(`${this.baseUrl}/api/manga/${mangaId}/chapters`);
    if (!res.ok) throw new Error(`FireFly fetchChapterList HTTP ${res.status} for manga ${mangaId}`);

    const data = await res.json() as { chapters?: FireFlyChapterItem[]; data?: FireFlyChapterItem[] };
    const items: FireFlyChapterItem[] = data.chapters ?? data.data ?? [];

    return items
      .filter((ch) => ch.id ?? ch.chapter_id)
      .map((ch): ChapterDiscovery => ({
        sourceId:      String(ch.id ?? ch.chapter_id),
        chapterNumber: this.parseChapterNumber(ch.chapter_number ?? ch.number),
        title:         ch.title ?? ch.name,
        sourceUrl:     `${this.baseUrl}/api/chapter/${ch.id ?? ch.chapter_id}/images`,
      }));
  }

  async fetchChapterPages(chapterId: string): Promise<string[]> {
    const res = await this.throttledFetch(`${this.baseUrl}/api/chapter/${chapterId}/images`);
    if (!res.ok) throw new Error(`FireFly fetchChapterPages HTTP ${res.status} for chapter ${chapterId}`);

    const data = await res.json() as FireFlyImagesResponse;
    const images =
      data.images ??
      data.data ??
      data.chapter?.images ??
      [];

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error(`FireFly: No images found for chapter ${chapterId}`);
    }

    return images.filter((url): url is string => typeof url === 'string' && url.startsWith('http'));
  }

  private normalizeStatus(raw?: string): 'ongoing' | 'completed' | 'hiatus' {
    const s = (raw ?? '').toLowerCase();
    if (s.includes('complet') || s === 'finished') return 'completed';
    if (s.includes('hiatus') || s.includes('pause') || s.includes('discontin')) return 'hiatus';
    return 'ongoing';
  }
}
