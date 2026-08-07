"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import senpaiDenLogo from "@/assets/img/logo.png";
import newChapterLogo from "@/assets/img/new chapter logo.png";
import { getUnreadNotificationCount, NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notifications";
import { getLevel, getReaderProgression, PROGRESSION_UPDATED_EVENT } from "@/lib/reader-progression";
import {
  Home, Compass, List, LayoutGrid, TrendingUp, RefreshCw,
  Bookmark, History, Users, Search, Bell, Flame, Upload,
  ChevronRight, Crown, Menu, X, Shield, UserRound,
  Moon, Sun, Laptop
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/discover" },
  { icon: LayoutGrid, label: "Categories", path: "/discover?genre=Action" },
  { icon: RefreshCw, label: "Latest Releases", path: "/discover?sort=updated" },
  { icon: Bookmark, label: "Library", path: "/library" },
  { icon: History, label: "History", path: "/history" },
];

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

function HomeSkeletonLoader() {
  const navRows = ["w-56", "w-36", "w-40", "w-48", "w-36", "w-36"];
  const chipRows = ["w-20", "w-24", "w-24", "w-20", "w-24", "w-20", "w-28"];

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[#0F1117] text-white" role="status" aria-label="Loading SenpaiDen">
      <aside className="hidden w-[260px] shrink-0 border-r border-white/5 bg-[#0F1117] px-5 py-5 md:block">
        <div className="mb-8 flex h-24 items-center justify-center border-b border-white/5 pb-5">
          <img src={senpaiDenLogo.src} alt="SenpaiDen Logo" className="w-full max-w-[210px] object-contain opacity-95" />
        </div>
        <div className="space-y-4">
          {navRows.map((widthClass, index) => (
            <div key={index} className={`h-12 ${widthClass} animate-pulse rounded-2xl ${index === 0 ? "bg-primary" : "bg-white/[0.07]"}`} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <div className="h-72 w-56 animate-pulse rounded-full bg-white/[0.08]" />
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="flex h-20 items-center gap-4 border-b border-white/5 px-5 md:px-10">
          <div className="h-12 flex-1 max-w-[360px] animate-pulse rounded-2xl bg-white/[0.08]" />
          <div className="hidden h-10 w-28 animate-pulse rounded-xl bg-[#FFD700]/20 md:block" />
          <div className="hidden h-10 w-10 animate-pulse rounded-full bg-white/[0.08] md:block" />
          <div className="hidden items-center gap-3 md:flex">
            <div className="h-8 w-20 animate-pulse rounded-lg bg-white/[0.08]" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/[0.12]" />
          </div>
        </div>

        <main className="px-5 py-8 md:px-10 md:py-14">
          <div className="grid max-w-4xl gap-8 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
            <div className="aspect-[3/4.4] w-full max-w-[280px] animate-pulse rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.16] via-white/[0.07] to-white/[0.02]" />
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="h-4 w-24 animate-pulse rounded bg-white/[0.16]" />
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.08]" />
              </div>
              <div className="space-y-4">
                <div className="h-16 w-full max-w-[360px] animate-pulse rounded-xl bg-white/[0.12]" />
                <div className="h-16 w-full max-w-[300px] animate-pulse rounded-xl bg-white/[0.10]" />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="h-14 w-48 animate-pulse rounded-2xl bg-white/[0.12] shadow-[0_24px_55px_rgba(124,58,237,0.22)]" />
                <div className="h-14 w-36 animate-pulse rounded-2xl border border-emerald-400/20 bg-emerald-400/10" />
              </div>
            </div>
          </div>

          <div className="mt-14 border-t border-white/5 pt-8">
            <div className="flex gap-3 overflow-hidden">
              {chipRows.map((widthClass, index) => (
                <div key={index} className={`h-10 shrink-0 ${widthClass} animate-pulse rounded-full border border-white/8 bg-white/[0.07]`} />
              ))}
            </div>
          </div>

          <div className="mt-10">
            <div className="mb-5 h-8 w-56 animate-pulse rounded-lg bg-white/[0.12]" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-2xl border border-white/5 bg-white/[0.06]" />
              ))}
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSiteLoading, setIsSiteLoading] = useState(true);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [accountName, setAccountName] = useState("Senpai");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [readerLevel, setReaderLevel] = useState(1);

  const isReader = pathname.match(/^\/manga\/[^/]+\/[^/]+(\/.*)?$/);

  useEffect(() => {
    const introStorageKey = "senpaiden_has_seen_intro_video_v1";
    const hasSeenIntro = localStorage.getItem(introStorageKey) === "true";
    const minimumLoaderTime = hasSeenIntro ? 450 : 1800;
    const startedAt = Date.now();
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    setShowIntroVideo(!hasSeenIntro);

    const finishLoading = () => {
      if (done) return;

      const elapsed = Date.now() - startedAt;
      const waitTime = Math.max(minimumLoaderTime - elapsed, 0);

      timer = setTimeout(() => {
        done = true;
        localStorage.setItem(introStorageKey, "true");
        setIsSiteLoading(false);
      }, waitTime);
    };

    if (document.readyState === "complete") {
      finishLoading();
    } else {
      window.addEventListener("load", finishLoading, { once: true });
      const fallbackTimer = setTimeout(finishLoading, 4500);
      return () => {
        done = true;
        window.removeEventListener("load", finishLoading);
        clearTimeout(fallbackTimer);
        if (timer) clearTimeout(timer);
      };
    }

    return () => {
      done = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const syncProgression = () => setReaderLevel(getLevel(getReaderProgression().totalExp));
    syncProgression();
    window.addEventListener(PROGRESSION_UPDATED_EVENT, syncProgression);
    window.addEventListener("storage", syncProgression);
    return () => {
      window.removeEventListener(PROGRESSION_UPDATED_EVENT, syncProgression);
      window.removeEventListener("storage", syncProgression);
    };
  }, []);

  useEffect(() => {
    const syncNotifications = () => setUnreadNotifications(getUnreadNotificationCount());
    syncNotifications();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, syncNotifications);
    window.addEventListener("storage", syncNotifications);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, syncNotifications);
      window.removeEventListener("storage", syncNotifications);
    };
  }, []);

  useEffect(() => {
    const syncAccountName = () => {
      try {
        const saved = localStorage.getItem("senpai_account");
        const account = saved ? JSON.parse(saved) : null;
        setAccountName(account?.displayName?.trim() || "Senpai");
      } catch {
        setAccountName("Senpai");
      }
    };

    syncAccountName();
    window.addEventListener("senpai-account-updated", syncAccountName);
    return () => window.removeEventListener("senpai-account-updated", syncAccountName);
  }, []);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-exo bg-background text-foreground relative">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden md:block">
        <div className="absolute top-0 left-1/3 w-[700px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #FF2E2E 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/2 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }} />
      </div>

      {/* LOADING SCREEN */}
      <div className={`fixed inset-0 z-[100] bg-[#0F1117] transition-opacity duration-500 flex items-center justify-center ${isSiteLoading ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {showIntroVideo ? (
          <video
            src="/loading-page.mp4"
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            aria-label="SenpaiDen loading intro"
            className="w-full h-full object-cover"
          />
        ) : (
          <HomeSkeletonLoader />
        )}
      </div>

      {/* MOBILE TOP NAV (Visible only on small screens) */}
      {!isReader && (
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center px-4 h-14 gap-2 bg-[#0F1117]/95 backdrop-blur-xl border-b border-red-500/10">
        
        <div className="p-2 -ml-2 w-10"></div>

        <Link href="/" className="flex items-center gap-2 mx-auto">
          <img src={senpaiDenLogo.src} alt="SenpaiDen Logo" className="h-7 w-auto object-contain" />
        </Link>
        
        <Link href="/search" className="p-2 -mr-2 text-muted-foreground">
          <Search size={20} />
        </Link>
      </nav>
      )}

      {/* DESKTOP SIDEBAR */}
      {!isReader && (
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col z-50 bg-[#0F1117]/95 backdrop-blur-xl border-r border-white/5 overflow-y-auto no-scrollbar pb-6">
        {/* LOGO */}
        <Link href="/" className="flex items-center justify-center gap-3 px-4 py-4 shrink-0 border-b border-white/5">
          <img src={senpaiDenLogo.src} alt="SenpaiDen Logo" className="w-full max-w-[200px] h-auto object-contain drop-shadow-[0_0_8px_rgba(255,46,46,0.3)]" />
        </Link>

        {/* MENU ITEMS */}
        <div className="flex-1 flex flex-col gap-1 px-4">
          {SIDEBAR_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const reallyActive = isActive(item.path);

            return (
              <Link key={i} href={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: reallyActive ? "#FF2E2E" : "transparent",
                  color: reallyActive ? "white" : "#A1A1AA" // zinc-400
                }}>
                <Icon size={18} className={reallyActive ? "text-white" : "text-zinc-400"} />
                <span className="text-[13px] font-bold font-noto tracking-wide">{item.label}</span>
              </Link>
            );
          })}
          {/* Removed Upload Manga Button */}
        </div>

        {/* NEW CHAPTER LOGO */}
        <div className="mt-8 px-4 relative mb-2 flex-shrink-0 flex justify-center">
          <img src={newChapterLogo.src} alt="New Chapter" className="w-full scale-110 h-auto object-contain drop-shadow-[0_0_15px_rgba(255,46,46,0.15)]" />
        </div>

        {/* FOOTER */}
        <div className="mt-auto px-6 pt-4 flex flex-col gap-5 flex-shrink-0">
           <div>
              <p className="text-[9px] text-zinc-600 font-medium leading-tight mb-3">
                © 2026 SenpaiDen<br />All rights reserved.
              </p>
              <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 w-fit">
                 <button className="p-1.5 rounded-full bg-white/10 text-white shadow-sm"><Moon size={12} /></button>
                 <button className="p-1.5 rounded-full text-zinc-500 hover:text-white"><Sun size={12} /></button>
                 <button className="p-1.5 rounded-full text-zinc-500 hover:text-white"><Laptop size={12} /></button>
                 <div className="w-px h-3 bg-white/10 mx-1" />
                 <Link href="/admin" className="p-1.5 rounded-full text-zinc-500 hover:text-primary transition-colors">
                   <Shield size={12} />
                 </Link>
              </div>
           </div>
        </div>
      </aside>
      )}

      {/* MOBILE BOTTOM NAV */}
      {!isReader && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F1117]/95 backdrop-blur-xl border-t border-primary/10 z-50 flex items-center justify-around px-2 pb-safe">
        {SIDEBAR_ITEMS.slice(0, 5).map((item, i) => {
           const Icon = item.icon;
           const reallyActive = isActive(item.path);
           const shortLabel = item.label === "Latest Releases" ? "Latest" : item.label;
           return (
              <Link key={i} href={item.path} className="flex flex-col items-center justify-center min-w-[48px] h-12 gap-1 relative">
                <Icon size={20} style={{ color: reallyActive ? "#FF2E2E" : "#8892a4" }} />
                {reallyActive && (
                  <span className="absolute -top-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_#FF2E2E]" />
                )}
                <span className="text-[9px] font-semibold text-center whitespace-nowrap" style={{ color: reallyActive ? "#FF2E2E" : "#8892a4" }}>{shortLabel}</span>
              </Link>
           )
        })}
      </nav>
      )}

      {/* MOBILE SIDE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-14 left-0 bottom-0 w-64 bg-[#0F1117] border-r border-primary/10 flex flex-col py-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
             {SIDEBAR_ITEMS.map((item, i) => (
                <Link key={i} href={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors">
                   <item.icon size={20} className={isActive(item.path) ? "text-primary" : "text-muted-foreground"} />
                   <span className={`font-semibold ${isActive(item.path) ? "text-primary" : "text-foreground"}`}>{item.label}</span>
                </Link>
             ))}
             <div className="mx-4 my-2 h-px bg-white/5" />
             {[
               { icon: Crown, label: "Premium", path: "/premium" },
               { icon: Bell, label: "Notifications", path: "/notifications" },
               { icon: UserRound, label: "Account", path: "/account" },
             ].map((item) => (
               <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center gap-4 px-6 py-3 text-zinc-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60">
                 <item.icon size={20} className={isActive(item.path) ? "text-primary" : "text-muted-foreground"} />
                 <span className={`font-semibold ${isActive(item.path) ? "text-primary" : "text-foreground"}`}>{item.label}</span>
                 {item.path === "/notifications" && unreadNotifications > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-black text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
               </Link>
             ))}
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-h-screen ${!isReader ? "md:pl-[260px]" : "md:pl-0"} relative z-10 min-w-0 overflow-hidden`}>
        {/* DESKTOP TOP NAV */}
        {!isReader && (
        <header className="hidden md:flex h-[72px] items-center px-8 shrink-0 relative z-20">
          <form onSubmit={handleSearch} className="relative w-full max-w-[320px]">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search manga..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-[13px] text-foreground placeholder:text-zinc-500 outline-none transition-all font-noto bg-white/5 border border-white/5 hover:border-white/10 focus:border-primary/50 focus:bg-white/10"
            />
          </form>

          <div className="flex items-center gap-4 ml-auto">
            <Link href="/premium" className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60">
              <Crown size={14} /> Premium
            </Link>
            <Link href="/notifications" aria-label={`Open notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`} className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
              <Bell size={18} />
              {unreadNotifications > 0 && <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-[#0F1117] bg-primary px-0.5 text-[8px] font-black leading-none text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
            </Link>
            <Link href="/account" aria-label="Open account" className="flex items-center gap-2 pl-2 cursor-pointer group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
              <div className="flex flex-col items-end">
                <span className="max-w-24 truncate text-[12px] font-bold text-white group-hover:text-primary transition-colors">{accountName}</span>
                <span className="text-[10px] text-zinc-500">Lv. {readerLevel}</span>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 group-hover:border-primary transition-colors">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&auto=format" alt="User" className="w-full h-full object-cover" />
              </div>
              <ChevronRight size={14} className="text-zinc-500 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </header>
        )}
        
        {/* PAGE CONTENT */}
        <main className={`flex-1 overflow-x-hidden ${!isReader ? "pt-14 md:pt-0 pb-16 md:pb-0" : ""} w-full`}>
          {children}
        </main>
      </div>

    </div>
  );
}
