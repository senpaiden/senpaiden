"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  ScrollText, 
  BookOpen, 
  Columns,
  List, 
  Maximize2,
  Minimize2,
  ArrowLeftRight,
  ArrowUpDown,
  Maximize,
  Trophy,
  Sparkles,
  X,
  PartyPopper
} from "lucide-react";
import { ReaderImage, PageFitMode } from "./ReaderImage";
import { StaleBanner } from "./StaleBanner";
import { RecommendationsRow } from "./RecommendationsRow";

import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface SliceData {
  key: string;
  width: number;
  height: number;
  blurhash?: string;
}

interface ChapterMetadata {
  id: string;
  chapter_number: number;
  title?: string;
  job_status?: string;
}

interface MangaReaderContainerProps {
  mangaId: string;
  mangaTitle: string;
  chapterNumber: string;
  chapters: ChapterMetadata[];
  slices: SliceData[];
  freshness?: "fresh" | "stale" | "archived";
  r2BaseUrl: string;
}

const getSliceUrl = (baseUrl: string, key: string) => {
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanKey = key.replace(/^\//, '');
  return `${cleanBase}/${cleanKey}`;
};

type ReadingMode = "webtoon" | "single" | "double";

export function MangaReaderContainer({
  mangaId,
  mangaTitle,
  chapterNumber,
  chapters,
  slices,
  freshness,
  r2BaseUrl
}: MangaReaderContainerProps) {
  const router = useRouter();
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [currentSliceIndex, setCurrentSliceIndex] = useState(0);
  const [isCounterVisible, setIsCounterVisible] = useState(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>("webtoon");
  const [pageFit, setPageFit] = useState<PageFitMode>("fit-width");
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [activePagedIndex, setActivePagedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800); // Default max-width

  const counterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculate scaled heights for virtual windowing
  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(Math.min(window.innerWidth, 800));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Background Image Preloader Engine (MangaDex Fast Loading Hack)
  useEffect(() => {
    if (!slices || slices.length === 0) return;
    const startIndex = readingMode === "webtoon" ? currentSliceIndex : activePagedIndex;
    const preloadCount = readingMode === "double" ? 6 : 4;

    for (let i = 1; i <= preloadCount; i++) {
      const targetIdx = startIndex + i;
      if (slices[targetIdx]) {
        const imgUrl = getSliceUrl(r2BaseUrl, slices[targetIdx].key);
        const img = new Image();
        img.src = imgUrl;
      }
    }
  }, [slices, currentSliceIndex, activePagedIndex, readingMode, r2BaseUrl]);

  const virtualizer = useWindowVirtualizer({
    count: readingMode === 'webtoon' ? slices.length : 0,
    estimateSize: (index) => {
      const slice = slices[index];
      if (!slice || !slice.width || !slice.height) return window.innerHeight;
      
      let estimatedHeight = (containerWidth / slice.width) * slice.height;

      // In fit-height mode, the image height is constrained by max-h-[85vh] or [90vh]
      if (pageFit === "fit-height" && typeof window !== "undefined") {
        // Assume 85vh for safe estimation. If the unconstrained height is larger, it gets capped.
        const maxHeight = window.innerHeight * 0.85; 
        if (estimatedHeight > maxHeight) {
          estimatedHeight = maxHeight;
        }
      }

      return estimatedHeight;
    },
    overscan: 5,
  });

  // Sorted chapters ascending
  const sortedChapters = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  const currentChapterNum = parseFloat(chapterNumber);
  const currentChapterIndex = sortedChapters.findIndex(c => c.chapter_number === currentChapterNum);
  
  const prevChapter = currentChapterIndex > 0 ? sortedChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < sortedChapters.length - 1 ? sortedChapters[currentChapterIndex + 1] : null;

  // Load saved settings & progress on mount + record chapter read history
  useEffect(() => {
    const savedMode = localStorage.getItem("senpai_reader_mode") as ReadingMode;
    if (savedMode === "single" || savedMode === "double" || savedMode === "webtoon") {
      setReadingMode(savedMode);
    }

    const savedFit = localStorage.getItem("senpai_page_fit") as PageFitMode;
    if (savedFit === "fit-width" || savedFit === "fit-height" || savedFit === "original") {
      setPageFit(savedFit);
    }

    const savedProgress = localStorage.getItem(`senpai_progress_${mangaId}`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        if (parsed.chapterNumber === chapterNumber && typeof parsed.sliceIndex === "number") {
          setCurrentSliceIndex(parsed.sliceIndex);
          setActivePagedIndex(parsed.sliceIndex);
        }
      } catch (e) {}
    }

    // Record chapter in read list
    try {
      const readStr = localStorage.getItem(`senpai_read_chapters_${mangaId}`);
      let readArr: number[] = readStr ? JSON.parse(readStr) : [];
      if (!readArr.includes(currentChapterNum)) {
        readArr.push(currentChapterNum);
        localStorage.setItem(`senpai_read_chapters_${mangaId}`, JSON.stringify(readArr));
      }
    } catch (e) {}
  }, [mangaId, chapterNumber, currentChapterNum]);

  // Debounced progress saver reference to prevent scroll thrashing (Bug M1 Fix)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Persist current progress to localStorage
  const saveProgress = (index: number) => {
    setCurrentSliceIndex(index);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      localStorage.setItem(`senpai_progress_${mangaId}`, JSON.stringify({
        chapterNumber,
        sliceIndex: index,
        timestamp: Date.now()
      }));
    }, 250);
  };

  // Safe chapter routing helper (Bug H3 Fix)
  const navigateToChapter = (targetChapter: ChapterMetadata) => {
    const isProcessing = targetChapter.job_status === 'QUEUED' || targetChapter.job_status === 'PROCESSING';
    if (isProcessing) {
      router.push(`/manga/${mangaId}/${targetChapter.chapter_number}/processing`);
    } else {
      router.push(`/manga/${mangaId}/${targetChapter.chapter_number}`);
    }
  };

  // Trigger auto-fading page counter badge
  const triggerCounterVisibility = () => {
    setIsCounterVisible(true);
    if (counterTimeoutRef.current) clearTimeout(counterTimeoutRef.current);
    counterTimeoutRef.current = setTimeout(() => {
      setIsCounterVisible(false);
    }, 2200);
  };

  const hasPrefetchedNext = useRef(false);

  const prefetchNextChapter = async (nextChNum: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
      const url = `${apiUrl}/api/manga/${mangaId}/chapter/${nextChNum}`;
      
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.pages && data.pages.length > 0) {
        const prefetchKeys: string[] = [];
        for (const page of data.pages) {
          if (page.r2_keys) prefetchKeys.push(...page.r2_keys);
          if (prefetchKeys.length >= 3) break;
        }
        
        prefetchKeys.slice(0, 3).forEach(key => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'image';
          link.href = `${r2BaseUrl}/${key}`;
          document.head.appendChild(link);
        });
      }
    } catch (e) {
      // Fail silently, prefetching is a progressive enhancement
    }
  };

  const virtualItems = virtualizer.getVirtualItems();

  // Track Webtoon scroll using the virtualizer's currently active items
  useEffect(() => {
    if (readingMode !== "webtoon" || virtualItems.length === 0) return;

    // Pick a representative visible item (overscan means index 0 is slightly above viewport)
    const midItem = virtualItems[Math.min(1, virtualItems.length - 1)];
    if (midItem && midItem.index !== currentSliceIndex) {
      saveProgress(midItem.index);
      triggerCounterVisibility();

      // Phase 3 Fix: Predictive Prefetching at 70% threshold
      if (!hasPrefetchedNext.current && nextChapter && midItem.index >= slices.length * 0.7) {
        hasPrefetchedNext.current = true;
        prefetchNextChapter(nextChapter.chapter_number);
      }
    }
  }, [virtualItems, readingMode, nextChapter, slices.length, currentSliceIndex]);

  // Keyboard & Power-User navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        if (readingMode === "webtoon") {
          e.preventDefault();
          window.scrollBy({ top: 350, behavior: "smooth" });
        }
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        if (readingMode === "webtoon") {
          e.preventDefault();
          window.scrollBy({ top: -350, behavior: "smooth" });
        }
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (readingMode === "paged") {
          e.preventDefault();
          nextPagedPage();
        } else if (e.key === "ArrowRight" && nextChapter) {
          router.push(`/manga/${mangaId}/${nextChapter.chapter_number}`);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (readingMode === "paged") {
          e.preventDefault();
          prevPagedPage();
        } else if (e.key === "ArrowLeft" && prevChapter) {
          router.push(`/manga/${mangaId}/${prevChapter.chapter_number}`);
        }
      } else if (e.key === "n" || e.key === "N") {
        if (nextChapter) router.push(`/manga/${mangaId}/${nextChapter.chapter_number}`);
      } else if (e.key === "p" || e.key === "P") {
        if (prevChapter) router.push(`/manga/${mangaId}/${prevChapter.chapter_number}`);
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setIsHudVisible(prev => !prev);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readingMode, activePagedIndex, slices.length, nextChapter, prevChapter, mangaId, router]);

  // Handle center vs side screen clicks
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    const leftZone = width * 0.25;
    const rightZone = width * 0.75;

    if (readingMode === "single" || readingMode === "double") {
      if (x < leftZone) {
        prevPagedPage();
      } else if (x > rightZone) {
        nextPagedPage();
      } else {
        setIsHudVisible(prev => !prev);
      }
    } else {
      setIsHudVisible(prev => !prev);
    }
  };

  const step = readingMode === "double" ? 2 : 1;

  const nextPagedPage = () => {
    if (activePagedIndex < slices.length - step) {
      const nextIdx = activePagedIndex + step;
      setActivePagedIndex(nextIdx);
      saveProgress(nextIdx);
      triggerCounterVisibility();
    } else if (nextChapter) {
      navigateToChapter(nextChapter);
    } else {
      setIsEndModalOpen(true);
    }
  };

  const prevPagedPage = () => {
    if (activePagedIndex > 0) {
      const prevIdx = Math.max(0, activePagedIndex - step);
      setActivePagedIndex(prevIdx);
      saveProgress(prevIdx);
      triggerCounterVisibility();
    } else if (prevChapter) {
      navigateToChapter(prevChapter);
    }
  };

  const setMode = (mode: ReadingMode) => {
    setReadingMode(mode);
    localStorage.setItem("senpai_reader_mode", mode);
  };

  const updateFit = (fit: PageFitMode) => {
    setPageFit(fit);
    localStorage.setItem("senpai_page_fit", fit);
  };

  // Cross-browser Fullscreen toggle
  const toggleFullscreen = () => {
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;

      if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn("Fullscreen API not available on this device.");
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white relative select-none overflow-x-hidden pb-16">
      <StaleBanner freshness={freshness} />

      {/* Floating Header HUD */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isHudVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="sd-glass border-x-0 border-t-0 rounded-none px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Link
                href={`/manga/${mangaId}`}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors border border-white/10"
                title="Back to Manga Details"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="truncate">
                <h1 className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-md">{mangaTitle}</h1>
                <p className="text-xs text-[#A1A1AA]">Chapter {chapterNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 3 Reading Mode Selectors */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setMode("webtoon")}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    readingMode === "webtoon" ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 font-semibold" : "text-[#A1A1AA] hover:text-white"
                  }`}
                  title="Continuous Webtoon Strip"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Webtoon</span>
                </button>
                <button
                  onClick={() => setMode("single")}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    readingMode === "single" ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-semibold" : "text-[#A1A1AA] hover:text-white"
                  }`}
                  title="Single Page View"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Single</span>
                </button>
                <button
                  onClick={() => setMode("double")}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    readingMode === "double" ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 font-semibold" : "text-[#A1A1AA] hover:text-white"
                  }`}
                  title="Double Spread View (Book Mode)"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Double</span>
                </button>
              </div>

              {/* 3 Page Fit Selectors */}
              <div className="hidden sm:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => updateFit("fit-width")}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    pageFit === "fit-width" ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 font-semibold" : "text-[#A1A1AA] hover:text-white"
                  }`}
                  title="Fit to Container Width"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Width</span>
                </button>
                <button
                  onClick={() => updateFit("fit-height")}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    pageFit === "fit-height" ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-semibold" : "text-[#A1A1AA] hover:text-white"
                  }`}
                  title="Fit to Screen Viewport Height"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Height</span>
                </button>
                <button
                  onClick={() => updateFit("original")}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    pageFit === "original" ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 font-semibold" : "text-[#A1A1AA] hover:text-white"
                  }`}
                  title="Original Size (No Constraints)"
                >
                  <Maximize className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Original</span>
                </button>
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors border border-white/10"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Auto-Fading Floating Counter Badge */}
      <div
        className={`fixed top-16 right-4 z-40 bg-zinc-900/90 backdrop-blur-md text-zinc-200 border border-zinc-800 text-xs font-mono px-3 py-1.5 rounded-full shadow-lg transition-opacity duration-300 pointer-events-none ${
          isCounterVisible || isHudVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        Slice {readingMode === "webtoon" ? currentSliceIndex + 1 : activePagedIndex + 1} / {slices.length}
      </div>

      {/* Main Content Area */}
      <div className="w-full min-h-screen cursor-pointer" onClick={handleContainerClick}>
        {readingMode === "webtoon" ? (
          /* Webtoon Strip Mode: Seamless Virtualized list */
          <div 
            className="w-full relative mx-auto max-w-[800px] bg-black m-0 p-0 border-0 leading-none"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const slice = slices[virtualItem.index];
              const imgUrl = getSliceUrl(r2BaseUrl, slice.key);
              return (
                <div 
                  key={virtualItem.key} 
                  data-index={virtualItem.index} 
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full m-0 p-0 border-0 leading-none flex justify-center"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ReaderImage
                    src={imgUrl}
                    width={slice.width}
                    height={slice.height}
                    priority={virtualItem.index < 3}
                    blurhash={slice.blurhash}
                    pageFit={pageFit}
                  />
                </div>
              );
            })}
          </div>
        ) : readingMode === "single" ? (
          /* Single Page View */
          <div className="w-full min-h-screen flex items-center justify-center pt-16 pb-20 px-2 bg-black">
            {slices[activePagedIndex] && (
              <div className="w-full max-w-[800px]">
                <ReaderImage
                  src={getSliceUrl(r2BaseUrl, slices[activePagedIndex].key)}
                  width={slices[activePagedIndex].width}
                  height={slices[activePagedIndex].height}
                  priority={true}
                  blurhash={slices[activePagedIndex].blurhash}
                  pageFit={pageFit}
                />
              </div>
            )}
          </div>
        ) : (
          /* Double Spread View (Manga Dual Page Book Mode) */
          <div className="w-full min-h-screen flex items-center justify-center pt-16 pb-20 px-2 bg-black">
            <div className="w-full max-w-[1400px] flex flex-col md:flex-row items-center justify-center gap-0">
              {/* Left Page (Page A) */}
              {slices[activePagedIndex] && (
                <div className="w-full md:w-1/2 max-w-[700px] flex justify-end">
                  <ReaderImage
                    src={getSliceUrl(r2BaseUrl, slices[activePagedIndex].key)}
                    width={slices[activePagedIndex].width}
                    height={slices[activePagedIndex].height}
                    priority={true}
                    blurhash={slices[activePagedIndex].blurhash}
                    containerClassName="max-w-[700px]"
                    pageFit={pageFit}
                    align="right"
                  />
                </div>
              )}
              {/* Right Page (Page B) */}
              {slices[activePagedIndex + 1] && (
                <div className="w-full md:w-1/2 max-w-[700px] flex justify-start">
                  <ReaderImage
                    src={getSliceUrl(r2BaseUrl, slices[activePagedIndex + 1].key)}
                    width={slices[activePagedIndex + 1].width}
                    height={slices[activePagedIndex + 1].height}
                    priority={true}
                    blurhash={slices[activePagedIndex + 1].blurhash}
                    containerClassName="max-w-[700px]"
                    pageFit={pageFit}
                    align="left"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Nav HUD */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          isHudVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="sd-glass border-x-0 border-b-0 rounded-none px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            {/* Previous Chapter Button */}
            {prevChapter ? (
              <Link
                href={`/manga/${mangaId}/${prevChapter.chapter_number}`}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 text-[#A1A1AA] hover:text-white transition-colors border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Ch. {prevChapter.chapter_number}</span>
              </Link>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-black/50 text-xs font-semibold text-white/30 border border-white/5 flex items-center gap-1 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">First</span>
              </div>
            )}

            {/* Chapter Selector Dropdown */}
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-[#A1A1AA] hidden sm:block shrink-0" />
              <select
                value={chapterNumber}
                onChange={(e) => router.push(`/manga/${mangaId}/${e.target.value}`)}
                className="bg-[#101016] border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 cursor-pointer font-medium max-w-[130px] sm:max-w-[220px] truncate"
              >
                {sortedChapters.map((ch) => (
                  <option key={ch.id} value={ch.chapter_number}>
                    Chapter {ch.chapter_number} {ch.title ? `- ${ch.title}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Chapter or Series Complete Button */}
            {nextChapter ? (
              <Link
                href={`/manga/${mangaId}/${nextChapter.chapter_number}`}
                className="px-4 py-2 rounded-xl sd-gradient hover:opacity-90 text-xs font-bold flex items-center gap-1 text-white transition-opacity shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)]"
              >
                <span className="hidden sm:inline">Ch. {nextChapter.chapter_number}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={() => setIsEndModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-violet-500/20 active:scale-95"
              >
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span>Caught Up!</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* End of Series / Chapter Completion Recommendation Modal Popup */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#0D0D12] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setIsEndModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10 z-10"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Celebration Header */}
            <div className="text-center mb-6 pt-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/30 border border-violet-500/30 text-yellow-400 mb-3 shadow-lg shadow-violet-500/20">
                <Trophy className="w-7 h-7 animate-bounce text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                You&apos;ve caught up! <Sparkles className="w-5 h-5 text-yellow-400" />
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Completed Chapter {chapterNumber} of <span className="text-white font-semibold">{mangaTitle}</span>. Here are top recommendations based on what readers binged next:
              </p>
            </div>

            {/* Recommendations Row inside Modal */}
            <div className="mb-6">
              <RecommendationsRow mangaId={mangaId} type="cobinged" title="Readers Also Binged Next" />
            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-white/5">
              <Link
                href={`/manga/${mangaId}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white text-center transition-colors border border-white/10"
              >
                Manga Details
              </Link>
              <Link
                href="/discover"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-xs font-bold text-white text-center transition-all shadow-lg shadow-violet-500/20"
              >
                Discover More Manga
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
