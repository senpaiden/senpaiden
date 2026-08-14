"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, ShieldCheck } from "lucide-react";
import { getConsent, OPEN_CONSENT_EVENT, saveConsent } from "@/lib/consent";

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    const saved = getConsent();
    if (!saved) setOpen(true);
    else { setAnalytics(saved.analytics); setAdvertising(saved.advertising); }
    const show = () => { const current = getConsent(); setAnalytics(current?.analytics || false); setAdvertising(current?.advertising || false); setCustomize(true); setOpen(true); };
    window.addEventListener(OPEN_CONSENT_EVENT, show);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, show);
  }, []);

  const commit = (nextAnalytics: boolean, nextAdvertising: boolean) => {
    saveConsent({ analytics: nextAnalytics, advertising: nextAdvertising });
    setAnalytics(nextAnalytics); setAdvertising(nextAdvertising); setOpen(false); setCustomize(false);
  };

  if (!open) return null;
  return <div className="fixed inset-x-0 bottom-0 z-[150] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-5" role="dialog" aria-modal="true" aria-labelledby="consent-title">
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#11131A]/95 p-5 shadow-[0_-24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-6">
      <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Cookie className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 id="consent-title" className="font-black text-white">Your privacy choices</h2><p className="mt-1 text-xs leading-5 text-zinc-400 md:text-sm">Necessary storage keeps accounts and preferences working. With your permission, analytics can improve SenpaiDen and advertising can support the service. No optional category loads before you choose.</p><p className="mt-2 text-[11px] text-zinc-500"><Link href="/cookies" className="font-bold underline underline-offset-4 hover:text-white">Cookie policy</Link> · <Link href="/privacy" className="font-bold underline underline-offset-4 hover:text-white">Privacy policy</Link></p></div></div>
      {customize && <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><Preference title="Necessary" detail="Authentication, security and saved choices." checked disabled onChange={() => {}} /><Preference title="Analytics" detail="Helps us understand performance and feature usage." checked={analytics} onChange={setAnalytics} /><Preference title="Advertising" detail="Allows advertising storage and personalization signals." checked={advertising} onChange={setAdvertising} /></div>}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => setCustomize(!customize)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-zinc-300 hover:bg-white/10"><Settings2 className="h-4 w-4" />{customize ? "Back" : "Customize"}</button><button onClick={() => commit(false, false)} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs font-black text-zinc-300 hover:bg-white/5">Reject optional</button><button onClick={() => commit(customize ? analytics : true, customize ? advertising : true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-white hover:bg-red-500"><ShieldCheck className="h-4 w-4" />{customize ? "Save choices" : "Accept all"}</button></div>
    </div>
  </div>;
}

function Preference({ title, detail, checked, disabled, onChange }: { title: string; detail: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-14 items-center justify-between gap-4 rounded-xl px-2"><span><strong className="block text-sm text-white">{title}</strong><span className="text-[11px] leading-5 text-zinc-500">{detail}</span></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-red-500" /></label>;
}
