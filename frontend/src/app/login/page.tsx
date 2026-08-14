"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail, Shield, UserRound } from "lucide-react";
import { createReferralCode, getRegisteredAccounts, getStoredAccount, isSignedIn, registerAccount, startSession } from "@/lib/auth-storage";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn()) return window.location.replace("/account");
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup" || params.has("ref")) setMode("signup");
    setInviteCode(params.get("ref") || "");
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (step === "email") {
        if (mode === "signup" && getRegisteredAccounts().some((account) => account.email.toLowerCase() === normalizedEmail)) {
          throw new Error("An account with this email already exists. Sign in instead.");
        }
        const response = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail, mode }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not send the verification code.");
        setStep("otp");
        return;
      }

      const response = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail, token: otp }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Verification failed.");

      if (mode === "signup") {
        registerAccount({ displayName: displayName.trim(), email: normalizedEmail, bio: "Ready to find my next favorite manga.", referralCode: createReferralCode(), pendingReferralCode: inviteCode.trim().toUpperCase() });
      } else {
        const matched = getRegisteredAccounts().find((account) => account.email.toLowerCase() === normalizedEmail);
        const previous = getStoredAccount();
        startSession(matched || (previous?.email.toLowerCase() === normalizedEmail ? previous : { displayName: normalizedEmail.split("@")[0], email: normalizedEmail, bio: "Ready to find my next favorite manga.", referralCode: createReferralCode() }));
      }
      window.location.href = "/account";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setStep("email"); setOtp(""); setError("");
  };

  return <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-8">
    <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[128px]" />
    <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-[128px]" />
    <section className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25"><Shield className="h-8 w-8 text-white" /></div>
      <h1 className="mt-6 text-center text-3xl font-bold text-white">{mode === "login" ? "Welcome back" : "Join SenpaiDen"}</h1>
      <p className="mt-2 text-center text-sm text-zinc-400">{step === "email" ? "We'll verify your email with a one-time code" : `Enter the code sent to ${email}`}</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "signup" && step === "email" && <Field icon={UserRound} label="Display name"><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your reader name" maxLength={32} required className="auth-input" /></Field>}
        <Field icon={Mail} label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} readOnly={step === "otp"} placeholder="senpai@example.com" required className="auth-input" /></Field>
        {step === "otp" && <Field icon={KeyRound} label="6-digit OTP"><input autoFocus inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" minLength={6} required className="auth-input font-mono tracking-[0.35em]" /></Field>}
        {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-300">{error}</p>}
        <button disabled={isLoading || (step === "otp" && otp.length !== 6)} className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>{step === "email" ? "Send OTP" : mode === "login" ? "Verify & sign in" : "Verify & create account"}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></>}</button>
        {step === "otp" && <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="min-h-11 w-full text-sm font-bold text-zinc-400 hover:text-white">Change email or resend code</button>}
      </form>

      <p className="mt-7 text-center text-sm text-zinc-500">{mode === "login" ? "Don't have an account?" : "Already have an account?"} <button onClick={switchMode} className="font-bold text-primary hover:text-red-400">{mode === "login" ? "Sign up" : "Sign in"}</button></p>
      <Link href="/" className="mt-4 block text-center text-xs font-semibold text-zinc-500 underline decoration-zinc-700 underline-offset-4 hover:text-white">Continue as guest</Link>
    </section>
  </div>;
}

function Field({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-300">{label}</span><span className="relative block"><Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" /><span className="[&_.auth-input]:block [&_.auth-input]:w-full [&_.auth-input]:rounded-xl [&_.auth-input]:border [&_.auth-input]:border-white/10 [&_.auth-input]:bg-zinc-900/60 [&_.auth-input]:py-3 [&_.auth-input]:pl-11 [&_.auth-input]:pr-4 [&_.auth-input]:text-zinc-100 [&_.auth-input]:outline-none [&_.auth-input]:transition [&_.auth-input]:focus:border-primary [&_.auth-input]:focus:ring-2 [&_.auth-input]:focus:ring-primary/30 [&_.auth-input]:read-only:opacity-70">{children}</span></span></label>;
}
