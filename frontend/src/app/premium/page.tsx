"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api-client";
import { AlertCircle, Check, Crown, Download, LoaderCircle, Sparkles, Zap } from "lucide-react";
import { PREMIUM_PLANS, type PremiumPlanId } from "@/lib/premium-plans";

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckout {
  open(): void;
  on(event: "payment.failed", callback: () => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

const PLAN_NOTES: Record<PremiumPlanId, string> = {
  monthly: "Perfect for trying ad-free reading",
  halfYearly: "Save ₹45 across six months",
  yearly: "Best value — save ₹89 per year",
};

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanId>("yearly");
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [activeUntil, setActiveUntil] = useState<string | null>(null);

  useEffect(() => {
    try {
      const membership = JSON.parse(localStorage.getItem("senpai_premium") || "null");
      if (membership?.expiresAt && new Date(membership.expiresAt) > new Date()) {
        if (membership.planId in PREMIUM_PLANS) setSelectedPlan(membership.planId);
        setActiveUntil(membership.expiresAt);
      }
    } catch {}
  }, []);

  const startPayment = async () => {
    setMessage("");
    setIsPaying(true);
    try {
      const [scriptLoaded, order] = await Promise.all([
        loadRazorpayCheckout(),
        fetchApi<any>("/api/razorpay/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlan }),
        }),
      ]);
      if (!scriptLoaded || !window.Razorpay) throw new Error("Payment window could not load.");
      if (!order) throw new Error("Unable to start payment.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SenpaiDen",
        description: `${order.planName} Ad-Free Premium`,
        order_id: order.orderId,
        theme: { color: "#FF2E2E" },
        retry: { enabled: true },
        modal: { ondismiss: () => setIsPaying(false) },
        handler: async (response: RazorpaySuccess) => {
          const verification = await fetchApi<any>("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              proof: order.proof,
              planId: order.planId,
            }),
          });
          if (!verification || !verification.verified) {
            setMessage(verification?.error || "Payment verification failed.");
            setIsPaying(false);
            return;
          }
          localStorage.setItem("senpai_premium", JSON.stringify(verification));
          window.dispatchEvent(new Event("senpai-premium-updated"));
          setActiveUntil(verification.expiresAt);
          setMessage("Payment verified. Ad-free Premium is active.");
          setIsPaying(false);
        },
      });
      checkout.on("payment.failed", () => {
        setMessage("Payment failed. No plan was activated.");
        setIsPaying(false);
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start payment.");
      setIsPaying(false);
    }
  };

  const plans = Object.values(PREMIUM_PLANS);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#FFD700]/20 bg-[#12130F] px-6 py-10 md:px-12 md:py-14">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFD700]/10 blur-3xl" />
        <div className="relative max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 px-3 py-1 text-xs font-bold text-[#FFD700]"><Crown className="h-4 w-4" /> SenpaiDen Premium</span><h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-6xl">More manga.<br /><span className="text-[#FFD700]">Zero ads.</span></h1><p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 md:text-base">Unlock an uninterrupted reader, offline chapters, and recommendations tuned to your taste.</p></div>
      </section>
      <p className="mt-4 rounded-2xl border border-[#FFD700]/15 bg-[#FFD700]/5 px-4 py-3 text-center text-xs font-semibold text-zinc-300"><Crown className="mr-2 inline h-4 w-4 text-[#FFD700]" />Reach Reader Level 50 to unlock 1 year of Pro Plus Premium and ad-free reading for free.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-white/10 bg-[#11131A] p-6 md:p-8"><h2 className="text-xl font-black text-white">Included with Premium</h2><div className="mt-6 grid gap-4 sm:grid-cols-3">{[[Zap,"Ad-free reading","Stay inside the story."],[Download,"Offline chapters","Read wherever you go."],[Sparkles,"Better picks","Sharper recommendations."]].map(([Icon,title,text]) => { const FeatureIcon = Icon as typeof Zap; return <div key={title as string} className="rounded-2xl bg-white/[0.035] p-4"><FeatureIcon className="h-5 w-5 text-[#FFD700]" /><h3 className="mt-3 font-bold text-white">{title as string}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{text as string}</p></div>;})}</div></section>
        <section className="rounded-3xl border border-[#FFD700]/20 bg-[#15150F] p-6"><h2 className="font-black text-white">Choose your plan</h2><div className="mt-4 grid gap-3">{plans.map((plan) => <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} disabled={isPaying} className={`relative rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60 disabled:cursor-not-allowed disabled:opacity-60 ${selectedPlan === plan.id ? "border-[#FFD700]/60 bg-[#FFD700]/10" : "border-white/10 bg-black/10 hover:border-white/20"}`}><span className="flex items-center justify-between"><strong className="text-sm text-white">{plan.name}</strong>{selectedPlan === plan.id && <Check className="h-4 w-4 text-[#FFD700]" />}</span><span className="mt-2 block text-2xl font-black text-white">{plan.price}</span><span className="text-[11px] text-zinc-500">{PLAN_NOTES[plan.id]}</span>{plan.id === "yearly" && <span className="absolute right-3 top-3 rounded-full bg-[#FFD700] px-2 py-0.5 text-[9px] font-black text-black">BEST VALUE</span>}</button>)}</div><button onClick={startPayment} disabled={isPaying} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/60">{isPaying && <LoaderCircle className="h-4 w-4 animate-spin" />}{isPaying ? "Opening secure checkout…" : activeUntil ? "Extend Premium" : `Pay ${PREMIUM_PLANS[selectedPlan].price}`}</button>{activeUntil && <p className="mt-3 text-center text-xs font-semibold text-emerald-400">Ad-free active until {new Date(activeUntil).toLocaleDateString("en-IN")}</p>}{message && <p role="alert" className={`mt-3 flex items-start justify-center gap-1.5 text-center text-xs ${message.startsWith("Payment verified") ? "text-emerald-400" : "text-red-400"}`}><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{message}</p>}<p className="mt-3 text-center text-[10px] leading-4 text-zinc-600">Secure test checkout powered by Razorpay. Test mode does not charge real money.</p></section>
      </div>
    </div>
  );
}
