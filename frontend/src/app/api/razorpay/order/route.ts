import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { isPremiumPlanId, PREMIUM_PLANS } from "@/lib/premium-plans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { planId?: unknown } | null;
  const planId = body?.planId;
  if (!isPremiumPlanId(planId)) {
    return NextResponse.json({ error: "Choose a valid Premium plan." }, { status: 400 });
  }

  const plan = PREMIUM_PLANS[planId];
  const receipt = `senpai_${Date.now().toString(36)}_${plan.id}`;
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: plan.amount,
      currency: "INR",
      receipt,
      notes: { product: "SenpaiDen Ad-Free", plan: plan.id },
    }),
    cache: "no-store",
  });

  const order = await razorpayResponse.json().catch(() => null);
  if (!razorpayResponse.ok || !order?.id) {
    return NextResponse.json({ error: "Unable to start payment. Try again." }, { status: 502 });
  }

  const proof = createHmac("sha256", keySecret)
    .update(`${order.id}|${plan.id}|${plan.amount}`)
    .digest("hex");

  return NextResponse.json({
    keyId,
    orderId: order.id,
    amount: plan.amount,
    currency: "INR",
    planId: plan.id,
    planName: plan.name,
    proof,
  });
}
