import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, History, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/library", label: "Library", icon: Library },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  // Hide on reader screens (route like /manga/[slug]/[chapter])
  const isReader = /^\/manga\/[^/]+\/\d+$/.test(pathname || "");
  if (isReader) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="sd-glass flex items-center justify-around rounded-2xl px-2 py-2">
          {items.map((it) => {
            const active = it.href === "/" ? pathname === "/" : pathname?.startsWith(it.href);
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  active ? "text-white" : "text-[#71717A] hover:text-[#A1A1AA]"
                }`}
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-lg transition-all ${
                    active
                      ? "sd-gradient text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.7)]"
                      : "bg-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  const isReader = /^\/manga\/[^/]+\/\d+$/.test(pathname || "");
  if (isReader) return null;

  const links = [
    { href: "/", label: "Home" },
    { href: "/discover", label: "Discover" },
    { href: "/library", label: "Library" },
    { href: "/history", label: "History" },
    { href: "/search", label: "Search" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 hidden md:block">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="sd-glass flex items-center justify-between rounded-2xl px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg sd-gradient font-black text-white">先</div>
            <span className="text-sm font-bold tracking-[0.2em]">SENPAI DEN</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-white/10 text-white" : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/profile"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-bold"
          >
            S
          </Link>
        </div>
      </div>
    </header>
  );
}
