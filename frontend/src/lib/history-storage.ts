export interface HistoryRecord {
  mangaId: string;
  title: string;
  chapterNumber: number;
  sliceIndex: number;
  timestamp: number;
  coverUrl?: string;
}

export function saveHistoryLocal(record: HistoryRecord): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(`senpai_progress_${record.mangaId}`, JSON.stringify(record));
    }
  } catch (e) {
    // Ignore errors for private browsing or quota limits
  }
}

export function getLatestHistoryLocal(): HistoryRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const keys = Object.keys(localStorage);
    let latest: HistoryRecord | null = null;
    
    for (const key of keys) {
      if (key.startsWith("senpai_progress_")) {
        try {
          const item: HistoryRecord = JSON.parse(localStorage.getItem(key)!);
          if (!latest || item.timestamp > latest.timestamp) {
            latest = item;
          }
        } catch (err) {}
      }
    }
    return latest;
  } catch (e) {
    return null;
  }
}
