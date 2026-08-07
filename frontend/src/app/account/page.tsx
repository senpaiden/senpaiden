"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookOpen, Check, CheckCircle2, Copy, Crown, Gamepad2, Lock, Mail, Save, ShieldCheck, Shirt, Sparkles, UserPlus, UserRound, Users } from "lucide-react";
import { claimReaderReward, creditSuccessfulReferral, FIXED_EXP_AFTER_LEVEL, FIXED_EXP_FROM_LEVEL, getLevel, getLevelProgress, getMangaExpAward, getReaderProgression, getReferralExpAward, hasActivePremium, LEVEL_EXP_GROWTH_PERCENT, PREMIUM_EXP_MULTIPLIER, PROGRESSION_UPDATED_EVENT, READER_REWARDS, type ReaderProgression, type RewardId } from "@/lib/reader-progression";

interface AccountDetails {
  displayName: string;
  email: string;
  bio: string;
  referralCode?: string;
}

const DEFAULT_ACCOUNT: AccountDetails = {
  displayName: "Senpai",
  email: "reader@senpaiden.com",
  bio: "Chasing great panels, one chapter at a time.",
};

export default function AccountPage() {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT);
  const [saved, setSaved] = useState(false);
  const [progression, setProgression] = useState<ReaderProgression>({ totalExp: 0, readMangaIds: [], proPlusRewardClaimed: false, claimedRewardIds: [], creditedReferralIds: [], creditedReferralEmails: [], referralCode: "" });
  const [referredEmail, setReferredEmail] = useState("");
  const [premiumActive, setPremiumActive] = useState(false);
  const [referralMessage, setReferralMessage] = useState("");
  const [claimMessage, setClaimMessage] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("senpai_account");
      if (stored) setAccount({ ...DEFAULT_ACCOUNT, ...JSON.parse(stored) });
    } catch {}
  }, []);

  useEffect(() => {
    const syncPremium = () => setPremiumActive(hasActivePremium());
    syncPremium();
    window.addEventListener("senpai-premium-updated", syncPremium);
    window.addEventListener("storage", syncPremium);
    return () => {
      window.removeEventListener("senpai-premium-updated", syncPremium);
      window.removeEventListener("storage", syncPremium);
    };
  }, []);

  useEffect(() => {
    const syncProgression = () => setProgression(getReaderProgression());
    syncProgression();
    window.addEventListener(PROGRESSION_UPDATED_EVENT, syncProgression);
    return () => window.removeEventListener(PROGRESSION_UPDATED_EVENT, syncProgression);
  }, []);

  const levelProgress = getLevelProgress(progression.totalExp);
  const level = levelProgress.level;

  const saveAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem("senpai_account", JSON.stringify({ ...account, referralCode: progression.referralCode }));
    window.dispatchEvent(new Event("senpai-account-updated"));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(progression.referralCode);
      setReferralMessage("Referral code copied.");
    } catch {
      setReferralMessage("Copy failed. Select the code and copy it manually.");
    }
  };

  const creditReferral = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = creditSuccessfulReferral(referredEmail, account.email);
    setReferralMessage(result.ok ? `Unique referral credited. +${result.expAwarded} EXP earned.` : result.error);
    if (result.ok) {
      setProgression(result.progression);
      setReferredEmail("");
    }
  };

  const claimReward = (rewardId: RewardId) => {
    const result = claimReaderReward(rewardId);
    setClaimMessage(result.ok ? `${result.reward.title} claim saved. The fulfillment team can now verify it.` : result.error);
    if (result.ok) setProgression(result.progression);
  };

  const rewardIcons: Record<RewardId, typeof Crown> = { "pro-plus": Crown, tshirt: Shirt, "manga-volume": BookOpen, ps5: Gamepad2, "community-leader": Users };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-8">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Reader identity</p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Your account</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">Manage the name and details shown across your SenpaiDen experience.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="overflow-hidden rounded-3xl border border-white/10 bg-[#11131A]">
          <div className="h-24 bg-[radial-gradient(circle_at_top_left,rgba(255,46,46,0.55),transparent_65%),linear-gradient(120deg,#1B1020,#0F1117)]" />
          <div className="px-6 pb-6 text-center">
            <div className="mx-auto -mt-12 grid h-24 w-24 place-items-center rounded-full border-4 border-[#11131A] bg-zinc-800 shadow-[0_0_30px_rgba(255,46,46,0.25)]">
              <UserRound className="h-10 w-10 text-zinc-300" />
            </div>
            <h2 className="mt-3 truncate text-xl font-black text-white">{account.displayName || "Senpai"}</h2>
            <p className="text-xs text-zinc-500">Level {level} reader</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/5 p-3"><Bookmark className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-lg font-black text-white">{progression.readMangaIds.length}</p><p className="text-[10px] text-zinc-500">Manga read</p></div>
              <div className="rounded-2xl bg-white/5 p-3"><ShieldCheck className="mx-auto h-4 w-4 text-[#FFD700]" /><p className="mt-1 text-lg font-black text-white">{level}</p><p className="text-[10px] text-zinc-500">Level</p></div>
            </div>
          </div>
        </aside>

        <div className="grid gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-yellow-300/20 bg-[#15130E] p-5 md:p-7">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300"><Sparkles className="h-4 w-4" /> Reader rank</p><h2 className="mt-2 text-2xl font-black text-white">Level {level}</h2><p className="mt-1 text-sm text-zinc-400">Read a new manga to earn {getMangaExpAward()} EXP.{premiumActive && <span className="ml-1 font-bold text-yellow-300">Premium {PREMIUM_EXP_MULTIPLIER}× boost active.</span>}</p><p className="mt-1 text-xs text-zinc-600">Targets grow {LEVEL_EXP_GROWTH_PERCENT}% per level; from Level {FIXED_EXP_FROM_LEVEL}, every next level needs {FIXED_EXP_AFTER_LEVEL} EXP.</p></div><div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-right"><p className="text-xl font-black text-yellow-300">{levelProgress.currentExp}/{levelProgress.requiredExp}</p><p className="text-[10px] uppercase tracking-wider text-zinc-500">EXP to next level</p></div></div>
          <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-black/40" role="progressbar" aria-label="Level progress" aria-valuemin={0} aria-valuemax={levelProgress.requiredExp} aria-valuenow={levelProgress.currentExp}><div className="h-full rounded-full bg-gradient-to-r from-primary via-orange-400 to-yellow-300 transition-[width] duration-500" style={{ width: `${levelProgress.progressPercent}%` }} /></div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#11131A] p-5 md:p-7">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Crown className="h-5 w-5" /></span><div><h2 className="font-black text-white">Reward road</h2><p className="text-xs text-zinc-500">Every milestone is configurable from the environment file.</p></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {READER_REWARDS.map((reward) => {
              const Icon = rewardIcons[reward.id];
              const unlocked = level >= reward.level;
              const claimed = reward.id === "pro-plus" ? progression.proPlusRewardClaimed : progression.claimedRewardIds.includes(reward.id);
              return <article key={reward.id} className={`rounded-2xl border p-4 ${unlocked ? "border-yellow-300/25 bg-yellow-300/[0.055]" : "border-white/5 bg-black/15"}`}>
                <div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${unlocked ? "bg-yellow-300/10 text-yellow-300" : "bg-white/5 text-zinc-600"}`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black text-white">{reward.title}</h3><span className="shrink-0 text-[10px] font-black text-zinc-500">LV. {reward.level}</span></div><p className="mt-1 text-xs leading-5 text-zinc-500">{reward.description}</p></div></div>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3"><span className={`flex items-center gap-1.5 text-xs font-bold ${claimed ? "text-emerald-400" : unlocked ? "text-yellow-300" : "text-zinc-600"}`}>{claimed ? <CheckCircle2 className="h-3.5 w-3.5" /> : unlocked ? <Sparkles className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{claimed ? (reward.physical ? "Claim requested" : "Active") : unlocked ? "Unlocked" : `${reward.level - level} levels left`}</span>{unlocked && !claimed && reward.id !== "pro-plus" && <button onClick={() => claimReward(reward.id)} className="min-h-9 rounded-xl border border-yellow-300/20 bg-yellow-300/10 px-3 text-xs font-black text-yellow-300 transition hover:bg-yellow-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/60">{reward.physical ? "Request reward" : "Claim"}</button>}</div>
              </article>;
            })}
          </div>
          <p aria-live="polite" className="mt-3 min-h-5 text-xs text-emerald-400">{claimMessage}</p>
        </section>

        <section className="rounded-3xl border border-cyan-300/15 bg-[#0E1518] p-5 md:p-7">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><UserPlus className="h-5 w-5" /></span><div><h2 className="font-black text-white">Referral EXP</h2><p className="text-xs text-zinc-500">Earn {getReferralExpAward()} EXP for every unique referred email.{premiumActive && <span className="ml-1 font-bold text-yellow-300">Premium {PREMIUM_EXP_MULTIPLIER}× boost active.</span>}</p></div></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><div><label className="text-xs font-bold text-zinc-400" htmlFor="referral-code">Your permanent referral code</label><div className="mt-2 flex gap-2"><input id="referral-code" readOnly value={progression.referralCode} className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 font-mono text-xs font-bold text-cyan-300 outline-none sm:text-sm" /><button onClick={copyReferralCode} aria-label="Copy permanent referral code" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"><Copy className="h-4 w-4" /></button></div></div><form onSubmit={creditReferral}><label className="text-xs font-bold text-zinc-400" htmlFor="referred-email">Referred user email</label><div className="mt-2 flex gap-2"><input id="referred-email" required type="email" maxLength={254} value={referredEmail} onChange={(event) => setReferredEmail(event.target.value)} placeholder="friend@example.com" className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10" /><button className="min-h-12 rounded-2xl bg-cyan-300 px-4 text-xs font-black text-[#061013] transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60">Add EXP</button></div></form></div>
          <p aria-live="polite" className="mt-3 min-h-5 text-xs text-cyan-300">{referralMessage}</p><p className="text-[11px] leading-5 text-zinc-600">This code is generated once and stored permanently in your profile. Each email can earn EXP only once; your account email and duplicates are blocked.</p>
        </section>

        <form onSubmit={saveAccount} className="rounded-3xl border border-white/10 bg-[#11131A] p-5 md:p-7">
          <div className="flex items-center gap-3 border-b border-white/5 pb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
            <div><h2 className="font-bold text-white">Profile details</h2><p className="text-xs text-zinc-500">Saved locally on this device.</p></div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">Display name
              <input required maxLength={32} value={account.displayName} onChange={(e) => setAccount({ ...account, displayName: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">Email
              <div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /><input required type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15" /></div>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-300 md:col-span-2">Reader bio
              <textarea maxLength={160} rows={4} value={account.bio} onChange={(e) => setAccount({ ...account, bio: e.target.value })} className="resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15" />
              <span className="text-right text-[11px] font-normal text-zinc-600">{account.bio.length}/160</span>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <span aria-live="polite" className={`flex items-center gap-1 text-xs text-emerald-400 transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}><Check className="h-4 w-4" /> Saved</span>
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"><Save className="h-4 w-4" /> Save changes</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
