import Link from "next/link";
import {
  Flame, Star, Play, ChevronRight, ChevronLeft, Bookmark,
  TrendingUp, RefreshCw, Crown, Users, Zap, BookOpen,
  MessageCircle, Upload, Send, Check,
} from "lucide-react";
import { NewMangaCard, StarRating } from "@/components/NewMangaCard";

// Server Component fetching live data from Cloudflare Worker
export const revalidate = 60; // Edge Cache for 60 seconds

function DiscordIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15.39 5.862a12.834 12.834 0 0 0-3.328-1.047 1 1 0 0 0-.825.437l-.373.6a13.383 13.383 0 0 0-3.738 0l-.373-.6a1 1 0 0 0-.825-.437 12.834 12.834 0 0 0-3.328 1.047 1 1 0 0 0-.58.825c-.247 5.762 1.34 10.99 4.316 14.582a1 1 0 0 0 .736.38 12.887 12.887 0 0 0 3.791-1.22 1 1 0 0 0 .151-1.636 10.224 10.224 0 0 1-1.353-.878 1 1 0 0 1 .158-1.68l.192-.12a10.016 10.016 0 0 0 7.822 0l.192.12a1 1 0 0 1 .158 1.68 10.224 10.224 0 0 1-1.353.878 1 1 0 0 0 .151 1.636 12.887 12.887 0 0 0 3.791 1.22 1 1 0 0 0 .736-.38c2.976-3.591 4.563-8.82 4.316-14.582a1 1 0 0 0-.58-.825Z"/>
      <circle cx="8.5" cy="12.5" r="1.5" fill="currentColor"/>
      <circle cx="15.5" cy="12.5" r="1.5" fill="currentColor"/>
    </svg>
  )
}

function TwitterIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  )
}

function InstagramIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

function YoutubeIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 7.1C2.6 5.8 3.7 4.7 5 4.6 9.4 4.3 14.6 4.3 19 4.6c1.3.1 2.4 1.2 2.5 2.5.3 2.7.3 7.1 0 9.8-.1 1.3-1.2 2.4-2.5 2.5-4.4.3-9.6.3-19 0-1.3-.1-2.4-1.2-2.5-2.5-.3-2.7-.3-7.1 0-9.8z"/>
      <path d="m9.5 15.5 7-3.5-7-3.5v7z"/>
    </svg>
  )
}

const STATS = [
  { label: "Manga Series", value: "10K+", icon: BookOpen, color: "#FF2E2E" },
  { label: "Chapters", value: "250K+", icon: Zap, color: "#7C3AED" },
  { label: "Users", value: "50K+", icon: Users, color: "#06B6D4" },
  { label: "Satisfaction", value: "99%", icon: Star, color: "#F59E0B" },
];

const GENRES_DATA = [
  { name: "Action", count: "1.2K", emoji: "⚔️", color: "#FF2E2E" },
  { name: "Romance", count: "980", emoji: "💕", color: "#EC4899" },
  { name: "Fantasy", count: "850", emoji: "✨", color: "#8B5CF6" },
  { name: "Comedy", count: "720", emoji: "😂", color: "#F59E0B" },
  { name: "Horror", count: "410", emoji: "👻", color: "#10B981" },
  { name: "Sci-Fi", count: "390", emoji: "🚀", color: "#3B82F6" },
];

const COMMENTS = [
  { user: "akira_dx", text: "Chapter 264 of JJK literally broke me 😭🔥", time: "3m", manga: "Jujutsu Kaisen", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=40&h=40&fit=crop&auto=format" },
  { user: "luna_void", text: "Solo Leveling will forever be the GOAT manhwa no cap", time: "11m", manga: "Solo Leveling", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&auto=format" },
  { user: "ghost_ch", text: "Omniscient Reader had me crying for 2 hours straight 😭", time: "27m", manga: "Omniscient Reader", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=40&h=40&fit=crop&auto=format" },
];

export default async function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  
  let mangas: any[] = [];
  try {
    const res = await fetch(`${apiUrl}/api/manga?page=1&limit=20`);
    if (res.ok) {
      const data = await res.json();
      mangas = data.data || [];
    }
  } catch (e) {
    console.error("Failed to fetch mangas:", e);
  }

  // Map API data to the UI format
  const uiMangas = mangas.map((m: any) => ({
    id: m.id,
    slug: m.id,
    title: m.title,
    altTitle: m.alt_title || "",
    description: m.description || "",
    genres: m.genres || ["Action"],
    latest_chapter_number: m.latest_chapter_number || 1,
    status: m.status || "Ongoing",
    cover: m.cover_url,
    cover_url: m.cover_url,
    type: "Manga",
    rating: 4.8,
    isNew: Math.random() > 0.7
  }));

  const TOP_MANGA = uiMangas.slice(0, 5);
  const DAILY_PICK = uiMangas.length > 2 ? uiMangas[2] : uiMangas[0];
  
  if (!DAILY_PICK) {
    return <div className="p-8">Loading data...</div>;
  }

  return (
    <div className="text-foreground pb-20 md:pb-8">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden md:min-h-[520px]">
        {/* Background */}
        <div className="absolute inset-0 z-0 bg-[#0F1117]">
          <img src="/banner.png" alt="SenpaiDen Banner" className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-lighten" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1117] via-[#0F1117]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-transparent to-transparent" />
          {/* Speed lines */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none hidden md:block">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="absolute bg-white" style={{ width: "1px", height: `${50 + Math.random() * 130}px`, left: `${(i / 20) * 100}%`, top: `${Math.random() * 70}%`, transform: `rotate(${-18 + Math.random() * 8}deg)` }} />
            ))}
          </div>
          {/* Particles */}
          <div className="absolute w-1 h-1 rounded-full top-[15%] left-[22%] bg-primary shadow-[0_0_8px_#FF2E2E] opacity-60" />
          <div className="absolute w-1 h-1 rounded-full top-[55%] left-[78%] bg-purple-600 shadow-[0_0_8px_#7C3AED] opacity-60" />
          <div className="absolute w-1 h-1 rounded-full top-[72%] left-[18%] bg-primary shadow-[0_0_8px_#FF2E2E] opacity-60" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row items-center xl:justify-between gap-6 px-4 md:px-8 pt-8 md:pt-10 pb-2 md:min-h-[420px]">
          {/* Left text */}
          <div className="flex-1 max-w-[480px] w-full text-center xl:text-left mt-4 xl:mt-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5 text-[10px] font-black tracking-widest uppercase bg-red-500/10 border border-red-500/30 text-primary">
              <Flame size={11} /> #1 Manga Platform 2026
            </div>
            <h1 className="font-black leading-[0.93] tracking-[0.02em] mb-4 text-white font-rajdhani text-5xl md:text-[clamp(2.6rem,4.5vw,5rem)]">
              READ. <span className="text-primary drop-shadow-[0_0_28px_rgba(255,46,46,0.55)]">DISCOVER.</span> OBSESS.
            </h1>
            <p className="text-sm md:text-base mb-7 leading-relaxed text-muted-foreground font-noto">
              The Ultimate Manga Experience — 10,000+ titles, updated every day.
            </p>
            <div className="flex items-center justify-center xl:justify-start gap-3">
              <Link href="/discover"
                className="flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-2xl font-black text-white transition-all hover:scale-105 bg-primary shadow-[0_0_36px_rgba(255,46,46,0.45)] font-rajdhani text-base">
                <Play size={18} className="fill-white" /> Start Reading
              </Link>
              <Link href="/discover"
                className="flex items-center gap-2 px-5 py-3 md:py-3.5 rounded-2xl font-semibold text-white transition-all hover:bg-white/10 bg-white/5 border border-white/10">
                Explore
              </Link>
            </div>
          </div>

          {/* Center Community CTA */}
          <div className="flex-1 hidden md:flex flex-col items-center justify-center w-full max-w-sm mt-10 xl:mt-0 xl:mx-auto relative z-10 px-4 xl:px-0">
            <div className="relative pt-8 px-6 pb-6 rounded-[2rem] bg-[#161B22]/60 backdrop-blur-md border border-white/5 flex flex-col items-center text-center shadow-[0_0_30px_rgba(255,46,46,0.1)] w-full transition-transform hover:scale-[1.02]">
               <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-[#0F1117] bg-[#161B22] flex items-center justify-center shadow-lg">
                  <Users size={32} className="text-primary" />
               </div>
               <h3 className="text-lg font-black text-white font-rajdhani mt-2 mb-1">JOIN OUR COMMUNITY</h3>
               <p className="text-[13px] text-zinc-300 font-medium leading-relaxed mb-6 font-noto">
                 Be part of our community and get exclusive updates, discuss manga, and more!
               </p>
               <Link href="/community" className="block w-full py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_4px_15px_rgba(255,46,46,0.3)] hover:scale-105 transition-transform mb-6">
                 Join Now
               </Link>
               
               {/* Social Icons */}
               <div className="flex items-center gap-3 w-full justify-center">
                 <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-[#5865F2] hover:bg-white/10 hover:border-white/10 transition-colors">
                   <DiscordIcon size={18} />
                 </Link>
                 <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-[#1DA1F2] hover:bg-white/10 hover:border-white/10 transition-colors">
                   <TwitterIcon size={18} />
                 </Link>
                 <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-[#E1306C] hover:bg-white/10 hover:border-white/10 transition-colors">
                   <InstagramIcon size={18} />
                 </Link>
                 <Link href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-[#FF0000] hover:bg-white/10 hover:border-white/10 transition-colors">
                   <YoutubeIcon size={18} />
                 </Link>
               </div>
            </div>
          </div>

          {/* Right panel: Top Manga + Daily Pick */}
          <div className="flex flex-col md:flex-row xl:flex-col gap-4 w-full xl:w-[200px] mt-8 xl:mt-0">
            {/* Top Manga */}
            <div className="rounded-2xl p-4 bg-[#161B22]/85 backdrop-blur-xl border border-primary/10 flex-1 xl:flex-none">
              <div className="flex items-center gap-2 mb-3">
                <Crown size={14} className="text-yellow-400" />
                <span className="font-black text-sm tracking-wide font-rajdhani text-white">TOP MANGA</span>
              </div>
              {TOP_MANGA.map((m: any, i: number) => (
                <Link href={`/manga/${m.id}`} key={m.id} className="flex items-center gap-2 py-2 group border-b border-white/5 last:border-b-0">
                  <div className="text-[10px] font-black w-4 text-center flex-shrink-0 font-jetbrains"
                    style={{ color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#8892a4" }}>{i + 1}</div>
                  <div className="w-6 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-800">
                    <img src={m.cover} alt={m.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-white truncate group-hover:text-red-400 transition-colors">{m.title}</div>
                    <div className="text-[9px] text-muted-foreground">Ch. {m.latest_chapter_number}</div>
                  </div>
                  <StarRating rating={m.rating} />
                </Link>
              ))}
              <Link href="/discover?sort=popular" className="block text-center text-[10px] font-bold mt-3 py-1.5 rounded-lg transition-all bg-red-500/10 text-primary border border-red-500/20 hover:bg-red-500/20">
                View All Rankings
              </Link>
            </div>

            {/* Daily Pick */}
            <div className="rounded-2xl overflow-hidden bg-[#161B22]/85 border border-yellow-400/15 flex-1 lg:flex-none">
              <div className="px-3 py-2 flex items-center gap-2 border-b border-white/5">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="font-black text-[11px] tracking-wider font-rajdhani text-yellow-400">DAILY PICK!</span>
              </div>
              <div className="relative h-28 hidden lg:block">
                <img src={DAILY_PICK.cover} alt={DAILY_PICK.title} className="w-full h-full object-cover opacity-65" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161B22]/95 to-transparent to-[60%]" />
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-[11px] font-black text-white font-rajdhani">{DAILY_PICK.title}</div>
                  <div className="text-[9px] text-muted-foreground">Ch. {DAILY_PICK.latest_chapter_number}</div>
                </div>
              </div>
              <div className="px-3 py-2">
                <Link href={`/manga/${DAILY_PICK.id}`}
                  className="block w-full text-center py-1.5 rounded-lg text-[10px] font-black text-white transition-all bg-primary shadow-[0_0_10px_rgba(255,46,46,0.35)] hover:scale-[1.02]">
                  Read Now →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 px-4 md:px-8 pb-8 hidden md:block">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform bg-[#161B22]/80 backdrop-blur-xl border border-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div className="text-xl font-black font-rajdhani" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRENDING NOW ── */}
      <section className="px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 md:gap-3">
            <Flame size={18} className="text-primary" />
            <h2 className="text-lg md:text-xl font-black tracking-wide font-rajdhani">TRENDING NOW!</h2>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500/15 text-primary border border-red-500/30">LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/discover?sort=popular" className="text-[11px] font-bold ml-2 hover:text-red-400 transition-colors text-primary">
              View All →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {uiMangas.slice(0, 4).map((m: any, i: number) => (
             <div key={m.id} className="w-full">
                <NewMangaCard manga={m} idx={i} />
             </div>
          ))}
        </div>
      </section>

      {/* ── EXPLORE BY GENRE ── */}
      <section className="px-4 md:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={18} className="text-primary" />
          <h2 className="text-lg md:text-xl font-black tracking-wide font-rajdhani">EXPLORE BY GENRE</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {GENRES_DATA.map((g) => (
            <Link key={g.name} href={`/discover?genre=${g.name}`}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 bg-[#161B22]/85 text-[#F8FAFC]"
              style={{ border: `1px solid ${g.color}22` }}
            >
              <span className="font-rajdhani">{g.name}</span>
              <span className="text-[10px] text-muted-foreground ml-1 font-jetbrains">{g.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── DON'T MISS + COMMUNITY ── */}
      <section className="px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Newsletter */}
        <div className="lg:col-span-2 rounded-3xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-red-500/10 to-[#161B22]/90 border border-primary/20">
          <div className="relative z-10">
            <h2 className="font-black text-2xl md:text-3xl mb-1 text-white font-rajdhani">
              DON'T MISS <span className="text-primary">ANY UPDATE!</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mb-6 font-noto">
              Get the latest chapters, news & updates straight to your inbox!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="email" placeholder="Enter your email..."
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none bg-white/5 border border-primary/20 text-[#F8FAFC] font-noto focus:border-primary" />
              <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 bg-primary shadow-[0_0_20px_rgba(255,46,46,0.4)]">
                 <Send size={15} /> Subscribe
              </button>
            </div>
          </div>
          {/* Decorative diagonal */}
          <div className="absolute top-0 right-0 w-48 h-full opacity-10 bg-gradient-to-br from-transparent to-primary via-transparent" />
        </div>

        {/* Community */}
        <div className="flex flex-col gap-3">
          {/* Discord */}
          <div className="rounded-2xl p-4 flex items-center gap-3 bg-gradient-to-br from-[#5865F2]/20 to-[#161B22]/90 border border-[#5865F2]/30">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#5865F2]">
              <MessageCircle size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Join Discord</div>
              <div className="text-[10px] text-muted-foreground">12.5K members · Live now</div>
            </div>
            <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#5865F2]">Join</button>
          </div>
          
          {/* Latest comments */}
          <div className="rounded-2xl p-4 flex-1 bg-[#161B22]/80 border border-white/5">
            <div className="text-[11px] font-bold mb-3 flex items-center gap-2">
              <MessageCircle size={12} className="text-primary" />
              Latest Comments
            </div>
            <div className="flex flex-col gap-3">
               {COMMENTS.map((c, i) => (
                 <div key={i} className="flex gap-2">
                   <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-800">
                     <img src={c.avatar} alt={c.user} className="w-full h-full object-cover" />
                   </div>
                   <div>
                     <div className="flex items-center gap-1">
                       <span className="text-[10px] font-bold text-white">{c.user}</span>
                       <span className="text-[9px] text-muted-foreground">· {c.time}</span>
                     </div>
                     <p className="text-[10px] text-muted-foreground leading-snug">{c.text}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST UPDATES ── */}
      <section className="px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 md:gap-3">
            <RefreshCw size={18} className="text-primary" />
            <h2 className="text-lg md:text-xl font-black tracking-wide font-rajdhani">LATEST UPDATES</h2>
          </div>
          <Link href="/discover?sort=updated" className="text-[11px] font-bold text-primary">View All →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {uiMangas.slice(0, 8).map((m: any) => (
            <Link href={`/manga/${m.id}`} key={m.id}
              className="flex items-center gap-3 p-3 rounded-xl group transition-all hover:scale-[1.02] bg-[#161B22]/80 border border-white/5 hover:border-primary/25">
              <div className="w-10 h-14 md:h-10 rounded-xl md:rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                <img src={m.cover} alt={m.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate group-hover:text-primary transition-colors">{m.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-jetbrains text-primary">Ch. {m.latest_chapter_number}</span>
                  {m.isNew && <span className="text-[8px] font-black px-1 rounded bg-primary text-white">NEW</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-4 md:px-8 py-10 mt-6 bg-[#080A0F]/95 border-t border-primary/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary">
              <Flame size={15} className="text-white" />
            </div>
            <span className="text-lg font-black font-rajdhani text-white">
              SENPAI<span className="text-primary">DEN</span>
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {["Browse", "Rankings", "Genres", "Community", "About", "Privacy"].map((l) => (
              <a key={l} href="#" className="text-xs text-muted-foreground hover:text-white transition-colors font-noto">{l}</a>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground font-jetbrains text-center md:text-left">
            © 2026 SenpaiDen. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
