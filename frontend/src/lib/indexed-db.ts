// ============================================================
// Senpai Den — Native IndexedDB Storage Engine
// Replaces 5MB localStorage limit with unlimited browser storage
// Stores: 'library' (Bookmarks), 'history' (Reading Progress)
// ============================================================

import type { Manga } from './manga-data';

const DB_NAME = 'SenpaiDenDB';
const DB_VERSION = 1;

export interface HistoryRecord {
  mangaId: string;
  title: string;
  chapterNumber: number;
  sliceIndex: number;
  timestamp: number;
  coverUrl?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('library')) {
        db.createObjectStore('library', { keyPath: 'slug' });
      }

      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'mangaId' });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// ── Library Store Actions ───────────────────────────────────────────────────

export async function getLibraryFromDB(): Promise<Manga[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('library', 'readonly');
      const store = tx.objectStore('library');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    // Fallback to localStorage
    const saved = localStorage.getItem('senpai_library');
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveToLibraryDB(manga: Manga): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('library', 'readwrite');
    const store = tx.objectStore('library');
    store.put(manga);
    // Also sync localStorage for fallback
    const saved = localStorage.getItem('senpai_library');
    const lib: Manga[] = saved ? JSON.parse(saved) : [];
    if (!lib.some((m) => m.slug === manga.slug)) {
      lib.push(manga);
      localStorage.setItem('senpai_library', JSON.stringify(lib));
    }
  } catch (e) {}
}

export async function removeFromLibraryDB(slug: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('library', 'readwrite');
    const store = tx.objectStore('library');
    store.delete(slug);
    // Sync localStorage
    const saved = localStorage.getItem('senpai_library');
    if (saved) {
      const lib: Manga[] = JSON.parse(saved);
      const filtered = lib.filter((m) => m.slug !== slug);
      localStorage.setItem('senpai_library', JSON.stringify(filtered));
    }
  } catch (e) {}
}

// ── History Store Actions ───────────────────────────────────────────────────

export async function saveHistoryDB(record: HistoryRecord): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.put(record);
    // Mirror to localStorage for fast sync
    localStorage.setItem(`senpai_progress_${record.mangaId}`, JSON.stringify(record));
  } catch (e) {
    localStorage.setItem(`senpai_progress_${record.mangaId}`, JSON.stringify(record));
  }
}

export async function getLatestHistoryDB(): Promise<HistoryRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('history', 'readonly');
      const store = tx.objectStore('history');
      const index = store.index('timestamp');
      const req = index.openCursor(null, 'prev'); // Highest timestamp first
      req.onsuccess = () => {
        const cursor = req.result;
        resolve(cursor ? (cursor.value as HistoryRecord) : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    // Fallback scan localStorage
    const keys = Object.keys(localStorage);
    let latest: HistoryRecord | null = null;
    for (const key of keys) {
      if (key.startsWith('senpai_progress_')) {
        try {
          const item: HistoryRecord = JSON.parse(localStorage.getItem(key)!);
          if (!latest || item.timestamp > latest.timestamp) {
            latest = item;
          }
        } catch (err) {}
      }
    }
    return latest;
  }
}
