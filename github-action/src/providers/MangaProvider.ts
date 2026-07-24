// ============================================================
// MangaProvider — Core Adapter Interface (Phase 2)
// ALL providers must implement this interface.
// Adding a new provider = new file implementing this interface.
// DO NOT modify this interface after Phase 2 ships (see roadmap AD).
// ============================================================

export interface MangaDiscovery {
  sourceId: string;         // Provider's internal ID for this manga
  sourceProvider: string;   // 'firefly' | 'mangahook'
  title: string;
  coverUrl?: string;
  genres?: string[];
  author?: string;
  status?: 'ongoing' | 'completed' | 'hiatus';
  description?: string;
}

export interface ChapterDiscovery {
  sourceId: string;         // Provider's internal chapter ID
  chapterNumber: number;
  title?: string;
  sourceUrl: string;        // Raw scraper URL for the chapter
}

export interface MangaProvider {
  readonly providerName: string;

  /**
   * Fetch the latest/updated manga list from this provider.
   * @param page - Pagination page number (1-indexed)
   * @returns Array of discovered manga entries
   */
  fetchLatestManga(page: number): Promise<MangaDiscovery[]>;

  /**
   * Fetch the raw page image URLs for a given chapter.
   * @param chapterId - Provider's internal chapter ID
   * @returns Ordered array of raw image URLs (not yet processed)
   */
  fetchChapterPages(chapterId: string): Promise<string[]>;

  /**
   * Fetch the list of chapters for a given manga.
   * @param mangaId - Provider's internal manga ID
   * @returns Array of discovered chapter metadata
   */
  fetchChapterList(mangaId: string): Promise<ChapterDiscovery[]>;
}
