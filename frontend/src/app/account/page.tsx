"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, Check, CheckCircle2, Copy, Crown, Gamepad2, Home, Lock, LogIn, LogOut, Mail, Save, Share2, ShieldCheck, Shirt, Sparkles, Ticket, UserPlus, UserRound, Users, X } from "lucide-react";
import { claimReaderReward, creditSuccessfulReferral, FIXED_EXP_AFTER_LEVEL, FIXED_EXP_FROM_LEVEL, getLevelProgress, getMangaExpAward, getReaderProgression, getReferralExpAward, hasActivePremium, LEVEL_EXP_GROWTH_PERCENT, PREMIUM_EXP_MULTIPLIER, PROGRESSION_UPDATED_EVENT, READER_REWARDS, type ReaderProgression, type RewardId } from "@/lib/reader-progression";
import { endSession, getRegisteredAccounts, getStoredAccount, isSignedIn, rememberAccount, startSession, type StoredAccount } from "@/lib/auth-storage";
import { addNotification } from "@/lib/notifications";

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
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [premiumActive, setPremiumActive] = useState(false);
  const [referralMessage, setReferralMessage] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  const [showReferralPrompt, setShowReferralPrompt] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [signupReferralCode, setSignupReferralCode] = useState("");
  const [signupReferralError, setSignupReferralError] = useState("");

  useEffect(() => {
    try {
      const stored = getStoredAccount();
      if (stored) {
        setAccount({ ...DEFAULT_ACCOUNT, ...stored });
        setSignupReferralCode(stored.pendingReferralCode || "");
        const reopenFromNotification = new URLSearchParams(window.location.search).get("referral") === "1";
        if (stored.referralPrompt === "pending" || reopenFromNotification) setShowReferralPrompt(true);
      }
    } catch {}
    setAuthenticated(isSignedIn());
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
  const referralShareCode = account.referralCode || progression.referralCode;

  useEffect(() => {
    if (authenticated && referralShareCode) rememberAccount({ ...account, referralCode: referralShareCode });
  }, [account, authenticated, referralShareCode]);

  const saveAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem("senpai_account", JSON.stringify({ ...account, referralCode: referralShareCode }));
    rememberAccount({ ...account, referralCode: referralShareCode });
    window.dispatchEvent(new Event("senpai-account-updated"));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  const shareReferral = async () => {
    const link = `${window.location.origin}/login?mode=signup&ref=${encodeURIComponent(referralShareCode)}`;
    const shareText = `Join me on SenpaiDen and discover your next manga. Use my referral code ${referralShareCode}: ${link}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join SenpaiDen", text: shareText, url: link });
        setReferralMessage("Invite shared.");
      } else {
        await navigator.clipboard.writeText(shareText);
        setReferralMessage("Invite message and link copied.");
      }
    } catch {
      setReferralMessage("Share cancelled. You can copy the invite link instead.");
    }
  };

  const copyInviteLink = async () => {
    const link = `${window.location.origin}/login?mode=signup&ref=${encodeURIComponent(referralShareCode)}`;
    await navigator.clipboard.writeText(link);
    setReferralMessage("Referral link copied.");
  };

  const claimReward = (rewardId: RewardId) => {
    const result = claimReaderReward(rewardId);
    setClaimMessage(result.ok ? `${result.reward.title} claim saved. The fulfillment team can now verify it.` : result.error);
    if (result.ok) setProgression(result.progression);
  };

  const updateReferralPrompt = (status: StoredAccount["referralPrompt"]) => {
    const updated = { ...account, referralCode: referralShareCode, referralPrompt: status, pendingReferralCode: "" };
    setAccount(updated);
    rememberAccount(updated);
    startSession(updated);
    setShowReferralPrompt(false);
  };

  const dismissReferralPrompt = () => {
    updateReferralPrompt("dismissed");
    addNotification({ id: `referral-reminder-${account.email}`, kind: "referral", title: "Add your referral code", detail: "You closed the referral step before finishing. Tap here if you still want to add a friend's code.", time: "Just now", href: "/account?referral=1", unread: true });
  };

  const applySignupReferral = () => {
    const code = signupReferralCode.trim().toUpperCase();
    const referrer = getRegisteredAccounts().find((item) => item.referralCode?.toUpperCase() === code);
    if (!code || !referrer) {
      setSignupReferralError("This referral code is not valid. Check the code and try again.");
      return;
    }
    if (referrer.email.toLowerCase() === account.email.toLowerCase()) {
      setSignupReferralError("You cannot use your own referral code.");
      return;
    }
    const result = creditSuccessfulReferral(account.email, referrer.email);
    if (!result.ok) {
      setSignupReferralError(result.error);
      return;
    }
    setProgression(result.progression);
    updateReferralPrompt("completed");
  };

  const rewardIcons: Record<RewardId, typeof Crown> = { "pro-plus": Crown, tshirt: Shirt, "manga-volume": BookOpen, ps5: Gamepad2, "community-leader": Users };

  if (authenticated === null) return null;

  if (!authenticated) {
    return <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-16"><section className="w-full rounded-3xl border border-white/10 bg-[#11131A] p-8 text-center shadow-2xl"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><UserRound className="h-8 w-8" /></span><h1 className="mt-5 text-3xl font-black text-white">Sign in to view your profile</h1><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">Your account details, reader level, rewards and referral link are available after you sign in.</p><Link href="/login" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-black text-white transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"><LogIn className="h-4 w-4" /> Log in</Link><p className="mt-4 text-xs text-zinc-500">New here? You can create an account on the next screen.</p></section></div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-8">
      {showReferralPrompt && <div className="fixed inset-0 z-[120] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="referral-prompt-title"><section className="relative w-full max-w-md rounded-3xl border border-cyan-300/20 bg-[#11151A] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.65)] md:p-8"><button onClick={dismissReferralPrompt} aria-label="Close referral prompt" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"><X className="h-5 w-5" /></button><span className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Ticket className="h-7 w-7" /></span><h2 id="referral-prompt-title" className="mt-5 pr-10 text-2xl font-black text-white">Do you have a referral code?</h2><p className="mt-2 text-sm leading-6 text-zinc-400">This is optional and appears only once for a new account. Adding a valid code rewards the friend who invited you.</p>{showReferralInput ? <div className="mt-6"><label htmlFor="signup-referral-code" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Referral code</label><input id="signup-referral-code" autoFocus value={signupReferralCode} onChange={(event) => { setSignupReferralCode(event.target.value.toUpperCase()); setSignupReferralError(""); }} placeholder="SENPAI-XXXX" className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 font-mono text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15" /><p role="alert" className="mt-2 min-h-5 text-xs text-red-300">{signupReferralError}</p><div className="mt-4 flex gap-3"><button onClick={() => setShowReferralInput(false)} className="min-h-11 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-300 hover:bg-white/10">Back</button><button onClick={applySignupReferral} className="min-h-11 flex-1 rounded-2xl bg-cyan-300 px-4 text-sm font-black text-[#061013] hover:bg-cyan-200">Apply code</button></div></div> : <div className="mt-7 grid grid-cols-2 gap-3"><button onClick={() => updateReferralPrompt("skipped")} className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-300 transition hover:bg-white/10">No, skip</button><button onClick={() => setShowReferralInput(true)} className="min-h-12 rounded-2xl bg-cyan-300 px-4 text-sm font-black text-[#061013] transition hover:bg-cyan-200">Yes, add code</button></div>}<Link href="/" onClick={dismissReferralPrompt} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"><Home className="h-4 w-4" /> Go to home</Link></section></div>}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Reader identity</p><h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Your account</h1><p className="mt-2 max-w-xl text-sm text-zinc-400">Manage the name and details shown across your SenpaiDen experience.</p></div>
        <a href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-200 transition hover:border-primary/30 hover:bg-primary/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"><Home className="h-4 w-4" /> Home</a>
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
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><label className="text-xs font-bold text-zinc-400" htmlFor="referral-code">Your referral code</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id="referral-code" readOnly value={referralShareCode} className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 font-mono text-sm font-bold text-cyan-300 outline-none" /><button onClick={copyInviteLink} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"><Copy className="h-4 w-4" /> Copy link</button><button onClick={shareReferral} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-xs font-black text-[#061013] transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"><Share2 className="h-4 w-4" /> Share invite</button></div></div>
          <p aria-live="polite" className="mt-3 min-h-5 text-xs text-cyan-300">{referralMessage}</p><p className="text-[11px] leading-5 text-zinc-600">Friends can open your link and enter this code during sign up. You earn EXP after a successful unique signup.</p>
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

        <section className="rounded-3xl border border-red-500/20 bg-[#11131A] p-5 md:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-white">Account session</h2>
              <p className="text-xs text-zinc-500">You are signed in as {account.email}.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  endSession();
                  window.location.href = "/login";
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>
        </section>

        </div>
      </div>
    </div>
  );
}
