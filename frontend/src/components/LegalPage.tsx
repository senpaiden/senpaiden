import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type LegalSection = { title: string; paragraphs?: string[]; bullets?: string[] };

export function LegalPage({ eyebrow, title, intro, icon: Icon, updated = "9 August 2026", sections }: { eyebrow: string; title: string; intro: string; icon: LucideIcon; updated?: string; sections: LegalSection[] }) {
  return <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10">
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#11131A] p-6 md:p-10">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span><p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</p><h1 className="mt-2 text-3xl font-black text-white md:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">{intro}</p><p className="mt-5 text-xs font-semibold text-zinc-600">Last updated: {updated}</p></div>
    </header>
    <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:sticky md:top-24"><p className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">On this page</p><nav className="mt-3 grid gap-1">{sections.map((section, index) => <a key={section.title} href={`#section-${index}`} className="rounded-xl px-2 py-2 text-xs font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white">{section.title}</a>)}</nav></aside>
      <main className="overflow-hidden rounded-3xl border border-white/10 bg-[#11131A] px-5 md:px-8">{sections.map((section, index) => <section id={`section-${index}`} key={section.title} className="scroll-mt-24 border-b border-white/5 py-7 last:border-0"><h2 className="text-xl font-black text-white">{section.title}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-zinc-400">{paragraph}</p>)}{section.bullets && <ul className="mt-4 grid gap-3">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-3 text-sm leading-6 text-zinc-400"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{bullet}</li>)}</ul>}</section>)}</main>
    </div>
    <p className="mt-6 text-center text-xs text-zinc-600">Questions? <Link href="/contact" className="font-bold text-zinc-400 underline underline-offset-4 hover:text-white">Contact SenpaiDen</Link></p>
  </div>;
}
