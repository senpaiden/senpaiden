export type ChapterStatus = "ready" | "processing" | "failed" | "retrying";

export interface MangaChapter {
  id: string;
  chapter_number: number;
  title?: string;
  language?: string;
  status?: ChapterStatus;
}

export interface Manga {
  slug: string;
  title: string;
  altTitle: string;
  description: string;
  coverHue: number;
  coverHue2: number;
  genres: string[];
  status: string;
  cover_url?: string;
  author?: string;
  artist?: string;
  tag?: string;
  latestChapter?: number;
  progress?: { chapter: number; page: number; percent: number };
  chapters?: MangaChapter[];
}

export function coverGradient(m: Manga) {
  return `linear-gradient(135deg, oklch(0.4 0.15 ${m.coverHue}) 0%, oklch(0.2 0.1 ${m.coverHue2}) 100%)`;
}
