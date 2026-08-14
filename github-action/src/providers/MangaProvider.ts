export interface MangaDiscovery {
  sourceId: string;
  sourceProvider: string;
  title: string;
  coverUrl?: string;
  genres?: string[];
  author?: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  description?: string;
}

export interface ChapterDiscovery {
  sourceId: string;
  chapterNumber: number;
  title?: string;
  sourceUrl: string;
}

export interface MangaProvider {
  readonly providerName: string;
  fetchLatestManga(page: number): Promise<MangaDiscovery[]>;
  fetchChapterList(mangaId: string): Promise<ChapterDiscovery[]>;
  fetchChapterPages(chapterId: string): Promise<string[]>;
}
