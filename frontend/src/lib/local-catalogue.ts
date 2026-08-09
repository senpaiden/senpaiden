import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type CatalogueManga = { id: string; title: string; alt_title: string; description: string; genres: string[]; latest_chapter_number: number; status: string; cover_url?: string };

let cache: CatalogueManga[] | null = null;

export async function getLocalCatalogue() {
  if (cache) return cache;
  try {
    const directory = path.resolve(process.cwd(), "..", "data", "mangas");
    const files = (await readdir(directory)).filter((file) => file.endsWith(".json"));
    const records = await Promise.all(files.map(async (file) => {
      const item = JSON.parse(await readFile(path.join(directory, file), "utf8"));
      const chapterNumbers = Array.isArray(item.chapters) ? item.chapters.map((chapter: { chapterNumber?: number }) => Number(chapter.chapterNumber) || 0) : [];
      return { id: item.mangaId || item.slug, title: item.title || item.slug, alt_title: "", description: item.description || "", genres: Array.isArray(item.genres) && item.genres.length ? item.genres : ["Manga"], latest_chapter_number: chapterNumbers.length ? Math.max(...chapterNumbers) : Number(item.totalChapters) || 0, status: item.status || "ongoing", cover_url: item.coverUrl } satisfies CatalogueManga;
    }));
    cache = records.sort((a, b) => a.title.localeCompare(b.title));
    return cache;
  } catch { return []; }
}
