import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isPremiumPlanId, PREMIUM_PLANS } from "@/lib/premium-plans";

export const runtime = "nodejs";

function matchesHex(actual: unknown, expected: string) {
  if (typeof actual !== "string" || !/^[a-f0-9]{64}$/i.test(actual)) return false;
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const { orderId, paymentId, signature, proof, planId } = body ?? {};
  if (![orderId, paymentId, signature, proof].every((value) => typeof value === "string") || !isPremiumPlanId(planId)) {
    return NextResponse.json({ error: "Invalid payment response." }, { status: 400 });
  }

  const plan = PREMIUM_PLANS[planId];
  const expectedProof = createHmac("sha256", keySecret)
    .update(`${orderId}|${plan.id}|${plan.amount}`)
    .digest("hex");
  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (!matchesHex(proof, expectedProof) || !matchesHex(signature, expectedSignature)) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${authorization}` },
    cache: "no-store",
  });
  const payment = await paymentResponse.json().catch(() => null);

  if (
    !paymentResponse.ok ||
    payment?.order_id !== orderId ||
    payment?.amount !== plan.amount ||
    payment?.currency !== "INR" ||
    payment?.status !== "captured"
  ) {
    return NextResponse.json({ error: "Payment is not captured yet." }, { status: 409 });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + plan.months);

  return NextResponse.json({
    verified: true,
    planId: plan.id,
    planName: plan.name,
    expiresAt: expiresAt.toISOString(),
  });
}
