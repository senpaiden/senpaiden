"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, Bookmark, Play, ChevronRight, BookOpen, Eye,
  User, Palette, TrendingUp, ThumbsUp, Share2,
} from "lucide-react";

interface DetailManga {
  id: string;
  title: string;
  alt_title?: string;
  description?: string;
  genres?: string[];
  status?: string;
  cover_url?: string;
  author?: string;
  artist?: string;
  view_count?: number;
  total_chapters?: number;
  rating?: number;
  views?: string | number;
}

interface DetailChapter {
  id: string;
  chapter_number: number;
  title?: string;
  language?: string;
  release_date?: string;
  views?: number;
  likes?: number;
}

export function MangaDetailClient({ 
  manga, 
  chapters, 
  related 
}: { 
  manga: DetailManga; 
  chapters: DetailChapter[]; 
  related: DetailManga[] 
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"chapters" | "info" | "reviews">("chapters");
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const genres = manga.genres || ["Action", "Fantasy"];
  const startChapter = chapters.length > 0 ? Math.min(...chapters.map(c => c.chapter_number)) : 1;
  const latestChapter = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_number)) : 1;

  useEffect(() => {
    try {
      const libraryStr = localStorage.getItem("senpai_library");
      if (libraryStr) {
        const library = JSON.parse(libraryStr) as Array<string | { slug?: string; id?: string }>;
        setSaved(library.some((m) => typeof m === "string" ? m === manga.id : m.slug === manga.id || m.id === manga.id));
      }
    } catch {}
  }, [manga.id]);

  const toggleSave = () => {
    try {
      const libraryStr = localStorage.getItem("senpai_library");
      let library = (libraryStr ? JSON.parse(libraryStr) : []) as Array<string | { slug?: string; id?: string; title?: string }>;

      if (saved) {
        library = library.filter((m) => typeof m === "string" ? m !== manga.id : (m.slug !== manga.id && m.id !== manga.id));
        setSaved(false);
      } else {
        const mangaObj = {
          slug: manga.id,
          title: manga.title,
          altTitle: "",
          description: manga.description || "",
          genres: manga.genres || ["Action"],
          status: manga.status || "Ongoing",
          cover_url: manga.cover_url,
          latestChapter: chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_number)) : 1,
        };
        library.push(mangaObj);
        setSaved(true);
      }
      localStorage.setItem("senpai_library", JSON.stringify(library));
      window.dispatchEvent(new CustomEvent("senpai_library_updated"));
    } catch {}
  };

  const REVIEWS = [
    { user: "akira_dx", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=40&h=40&fit=crop&auto=format", rating: 10, text: "Absolutely mind-blowing. Every chapter leaves you speechless. The art is insane and the story hits different. 10/10 no contest.", likes: 428, time: "3 days ago" },
    { user: "luna_void", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&auto=format", rating: 9, text: "One of the best stories I've read in years. The character development is incredible and the world-building is unmatched.", likes: 312, time: "1 week ago" },
  ];

  return (
    <div className="text-foreground font-exo pb-16 md:pb-8">
      {/* Banner */}
      <div className="relative h-52 overflow-hidden">
        <img src={manga.cover_url} alt={manga.title} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F1117]/80 to-[#0F1117]" />
        
        {/* Breadcrumb */}
        <div className="absolute top-4 left-4 md:left-8 flex items-center gap-2 text-xs text-muted-foreground font-noto">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/discover" className="hover:text-white transition-colors">Explore</Link>
          <ChevronRight size={12} />
          <span className="text-white truncate max-w-[150px] sm:max-w-xs">{manga.title}</span>
        </div>
      </div>

      {/* Main info */}
      <div className="px-4 md:px-8 -mt-16 md:-mt-12 relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover */}
          <div className="flex-shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl w-40 md:w-[180px] h-56 md:h-[250px] border-2 border-primary/40">
            <img src={manga.cover_url} alt={manga.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-16 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-primary border border-red-500/40">
                Manga
              </span>
              {genres.map((g: string) => (
                <Link key={g} href={`/discover?genre=${g}`}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-muted-foreground border border-white/10 hover:text-white transition-colors">
                  {g}
                </Link>
              ))}
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${manga.status === "Ongoing" ? "bg-emerald-500/15 text-emerald-500" : "bg-white/5 text-muted-foreground"}`}>
                {manga.status || "Ongoing"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 font-rajdhani">{manga.title}</h1>
            {manga.alt_title && <p className="text-sm text-muted-foreground mb-4 font-noto">{manga.alt_title}</p>}

            <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 mb-5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="text-lg md:text-xl font-black text-yellow-400 font-rajdhani">{manga.rating || 4.8}</span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen size={14} /> <span>{chapters.length} Chapters</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye size={14} /> <span>{manga.views || '12.4K'} Views</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <button onClick={() => router.push(`/manga/${manga.id}/${startChapter}`)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105 bg-primary shadow-[0_0_24px_rgba(255,46,46,0.4)] font-rajdhani text-[15px]">
                <Play size={17} className="fill-white" /> Start Reading
              </button>
              <button onClick={() => router.push(`/manga/${manga.id}/${latestChapter}`)}
                className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/10 bg-white/5 border border-white/10">
                Latest Chapter
              </button>
              <button onClick={toggleSave}
                className={`w-10 md:w-12 h-10 md:h-12 rounded-xl flex items-center justify-center transition-all border ${saved ? 'bg-primary/15 border-primary/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <Bookmark size={17} className={saved ? "fill-red-500 text-red-500" : ""} />
              </button>
              <button className="w-10 md:w-12 h-10 md:h-12 rounded-xl flex items-center justify-center transition-all bg-white/5 border border-white/10 hover:bg-white/10">
                <Share2 size={17} />
              </button>
            </div>
          </div>

          {/* Related manga */}
          <div className="hidden lg:block flex-shrink-0 w-52 pt-16">
            <h3 className="text-sm font-black mb-3 text-white font-rajdhani">Related Manga</h3>
            <div className="flex flex-col gap-2">
              {related.map((r: any) => (
                <Link href={`/manga/${r.id}`} key={r.id} className="flex items-center gap-2 p-2 rounded-xl group transition-all hover:bg-white/5">
                  <div className="w-8 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                    <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white group-hover:text-primary transition-colors truncate">{r.title}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{r.genres?.[0] || "Action"}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-8 mb-6 p-1 rounded-xl w-full sm:w-fit bg-black/30 overflow-x-auto no-scrollbar">
          {(["chapters", "info", "reviews"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-primary text-white shadow-[0_0_12px_rgba(255,46,46,0.4)]' : 'bg-transparent text-muted-foreground hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pb-10">
          {/* Chapters */}
          {activeTab === "chapters" && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground font-noto">{chapters.length} chapters total</span>
                <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-primary border border-red-500/25 hover:bg-red-500/20 transition-colors">
                  Sort
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {chapters.map((ch: any) => (
                  <Link href={`/manga/${manga.id}/${ch.chapter_number}`} key={ch.chapter_number}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl group transition-all hover:scale-[1.01] bg-[#161B22]/80 border border-white/5 hover:border-primary/25">
                    <div className="w-12 md:w-14 text-center md:text-right">
                      <span className="text-xs md:text-sm font-black text-primary font-jetbrains">Ch.{ch.chapter_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">{ch.title || `Chapter ${ch.chapter_number}`}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{ch.pages || 20} pages</div>
                    </div>
                    {ch.chapter_number > latestChapter - 2 && <span className="hidden sm:inline-block text-[9px] font-black px-1.5 py-0.5 rounded bg-primary text-white">NEW</span>}
                    <ChevronRight size={15} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
              <div>
                <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2 font-rajdhani">
                  <BookOpen size={15} className="text-primary" /> Synopsis
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-noto">{manga.description || "No synopsis available."}</p>
              </div>
              <div>
                <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2 font-rajdhani">
                  <User size={15} className="text-primary" /> Details
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Author", value: manga.author || "Unknown", icon: User },
                    { label: "Artist", value: manga.artist || "Unknown", icon: Palette },
                    { label: "Status", value: manga.status || "Ongoing", icon: TrendingUp },
                    { label: "Genres", value: genres.join(", "), icon: Star },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon size={14} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
                        <div className="text-sm text-white font-medium">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          {activeTab === "reviews" && (
            <div className="max-w-2xl space-y-4">
              {REVIEWS.map((r, i) => (
                <div key={i} className="p-4 md:p-5 rounded-2xl bg-[#161B22]/80 border border-white/5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                      <img src={r.avatar} alt={r.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate">{r.user}</span>
                        <span className="text-[10px] text-muted-foreground">{r.time}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={10} className={j < (r.rating/2) ? "fill-yellow-400 text-yellow-400" : "text-gray-700"} />
                        ))}
                        <span className="text-[10px] text-yellow-400 font-bold ml-1">{r.rating}/10</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 font-noto">{r.text}</p>
                  <button onClick={() => setLiked((p) => {
                      const n = new Set(p);
                      if (n.has(i)) {
                        n.delete(i);
                      } else {
                        n.add(i);
                      }
                      return n;
                    })}
                    className={`flex items-center gap-1.5 text-[11px] transition-all ${liked.has(i) ? "text-primary" : "text-muted-foreground hover:text-white"}`}>
                    <ThumbsUp size={12} className={liked.has(i) ? "fill-red-500" : ""} />
                    {r.likes + (liked.has(i) ? 1 : 0)} helpful
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
