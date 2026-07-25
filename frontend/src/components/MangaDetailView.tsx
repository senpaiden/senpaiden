"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Bookmark, 
  BookmarkCheck, 
  Search, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  BookOpen 
} from "lucide-react";

interface ChapterItem {
  id: string;
  chapter_number: number;
  title?: string;
  job_status: string;
}

interface MangaData {
  id: string;
  source_id?: string;
  title: string;
  cover_url: string;
  author?: string;
  status?: string;
  genres: string[];
  description?: string;
  chapters: ChapterItem[];
}

export function MangaDetailView({ manga }: { manga: MangaData }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [readChapters, setReadChapters] = useState<number[]>([]);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Load user progress and bookmarks on client mount
  useEffect(() => {
    // Check bookmark state
    try {
      const libraryStr = localStorage.getItem("senpai_library");
      if (libraryStr) {
        const library: string[] = JSON.parse(libraryStr);
        setIsBookmarked(library.includes(manga.id));
      }
    } catch (e) {}

    // Check reading progress
    try {
      const progressStr = localStorage.getItem(`senpai_progress_${manga.id}`);
      if (progressStr) {
        const progress = JSON.parse(progressStr);
        if (progress.chapterNumber) {
          setLastReadChapter(parseFloat(progress.chapterNumber));
        }
      }
    } catch (e) {}

    // Check read chapters list
    try {
      const readStr = localStorage.getItem(`senpai_read_chapters_${manga.id}`);
      if (readStr) {
        setReadChapters(JSON.parse(readStr));
      }
    } catch (e) {}
  }, [manga.id]);

  const toggleBookmark = () => {
    try {
      const libraryStr = localStorage.getItem("senpai_library");
      let library: string[] = libraryStr ? JSON.parse(libraryStr) : [];

      if (isBookmarked) {
        library = library.filter(id => id !== manga.id);
        setIsBookmarked(false);
      } else {
        library.push(manga.id);
        setIsBookmarked(true);
      }
      localStorage.setItem("senpai_library", JSON.stringify(library));
    } catch (e) {}
  };

  // Sort and Filter chapters
  const sortedChapters = [...manga.chapters].sort((a, b) => {
    return sortOrder === "desc" 
      ? b.chapter_number - a.chapter_number 
      : a.chapter_number - b.chapter_number;
  });

  const filteredChapters = sortedChapters.filter(ch => {
    if (!searchQuery.trim()) return true;
    const cleanQuery = searchQuery.toLowerCase().replace(/^(ch\.|chapter|c|#)\s*/, "").trim();
    const chNumStr = ch.chapter_number.toString();
    const chTitleStr = ch.title?.toLowerCase() || "";
    return chNumStr === cleanQuery || chNumStr.includes(cleanQuery) || chTitleStr.includes(searchQuery.toLowerCase());
  });

  // Calculate lowest / starting chapter
  const lowestChapter = [...manga.chapters].sort((a, b) => a.chapter_number - b.chapter_number)[0];
  const targetChapterNumber = lastReadChapter !== null ? lastReadChapter : (lowestChapter ? lowestChapter.chapter_number : 1);

  // Status Icons helper
  const StatusIcon = (status: string) => {
    switch (status) {
      case 'READY': return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'QUEUED':
      case 'PROCESSING': return <Clock className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      default: return <Clock className="w-4 h-4 text-zinc-500 shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 select-none">
      {/* Blurred Cover Backdrop Header */}
      <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden">
        <Image
          src={manga.cover_url}
          alt={manga.title}
          fill
          className="object-cover blur-3xl opacity-35 scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Top Back Navigation */}
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 z-20">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-300 hover:text-white bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800 transition-colors shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Back</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Poster */}
          <div className="w-48 md:w-60 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-zinc-800 bg-zinc-900 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] w-full">
              <Image src={manga.cover_url} alt={manga.title} fill className="object-cover" priority />
            </div>
          </div>

          {/* Meta Info & Primary Action CTAs */}
          <div className="flex-1 space-y-4 pt-2 md:pt-14 w-full">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {manga.title}
              </h1>
              <p className="text-sm text-zinc-400 mt-1.5">
                By <span className="text-zinc-200 font-medium">{manga.author || "Unknown Author"}</span>
              </p>
            </div>

            {/* Badges & Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold uppercase tracking-wider">
                {manga.status || "Ongoing"}
              </span>
              <span className="px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 font-medium">
                {manga.chapters.length} Chapters
              </span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {manga.genres.map((genre: string) => (
                <span key={genre} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg text-xs font-medium">
                  {genre}
                </span>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href={`/manga/${manga.id}/${targetChapterNumber}`}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 hover:scale-[1.02]"
              >
                <BookOpen className="w-4 h-4" />
                <span>{lastReadChapter !== null ? `Resume Ch. ${lastReadChapter}` : `Start Reading Ch. ${targetChapterNumber}`}</span>
              </Link>

              <button
                onClick={toggleBookmark}
                className={`px-5 py-3 rounded-xl border font-semibold text-sm flex items-center gap-2 transition-all ${
                  isBookmarked 
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
                <span>{isBookmarked ? "Bookmarked" : "Add to Library"}</span>
              </button>
            </div>

            {/* Synopsis / Description Block */}
            {manga.description && (
              <div className="pt-3 border-t border-zinc-800/80">
                <p className={`text-xs sm:text-sm text-zinc-300 leading-relaxed ${!isSynopsisExpanded ? "line-clamp-3" : ""}`}>
                  {manga.description}
                </p>
                {manga.description.length > 150 && (
                  <button
                    onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                    className="mt-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>{isSynopsisExpanded ? "Show Less" : "Read More"}</span>
                    {isSynopsisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chapter List Controls Section */}
        <div className="mt-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Chapters ({filteredChapters.length})
            </h2>

            {/* Controls: Search & Sort */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter chapters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
                title={`Sort ${sortOrder === "desc" ? "Ascending (1 → N)" : "Descending (N → 1)"}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
                <span>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
              </button>
            </div>
          </div>

          {/* Chapter List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChapters.map((chapter) => {
              const isRead = readChapters.includes(chapter.chapter_number) || lastReadChapter === chapter.chapter_number;
              const isProcessing = chapter.job_status === 'QUEUED' || chapter.job_status === 'PROCESSING';

              return (
                <Link
                  key={chapter.id}
                  href={`/manga/${manga.id}/${chapter.chapter_number}${isProcessing ? '/processing' : ''}`}
                  className={`group p-4 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01] ${
                    isRead
                      ? "bg-zinc-950/60 border-zinc-900/80 text-zinc-400 opacity-80 hover:opacity-100 hover:border-zinc-700"
                      : "bg-zinc-900/90 border-zinc-800/80 text-white hover:bg-zinc-800/90 hover:border-zinc-700 shadow-md"
                  }`}
                >
                  <div className="space-y-1 truncate pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                        Chapter {chapter.chapter_number}
                      </span>
                      {StatusIcon(chapter.job_status)}
                    </div>
                    {chapter.title && (
                      <p className="text-xs text-zinc-400 truncate">{chapter.title}</p>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </Link>
              );
            })}

            {filteredChapters.length === 0 && (
              <div className="col-span-full py-12 text-center bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                <p className="text-xs text-zinc-400 font-medium">No chapters match your search query.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
