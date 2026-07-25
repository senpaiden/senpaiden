import Link from "next/link";
import { Search, Menu } from "lucide-react";

export function TopBar({ transparent = false }: { transparent?: boolean }) {
  return (
    <header
      className={`sticky top-0 z-30 md:hidden ${
        transparent ? "bg-transparent" : "bg-[#08080C]/80 backdrop-blur-xl"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg sd-gradient font-black text-white text-sm">
            先
          </div>
          <span className="text-sm font-bold tracking-[0.2em]">SENPAI DEN</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#A1A1AA] transition hover:text-white"
          >
            <Search className="h-4 w-4" />
          </Link>
          <button
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#A1A1AA] transition hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
