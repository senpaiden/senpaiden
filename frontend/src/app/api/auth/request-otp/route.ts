import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getRequestClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rate = checkRateLimit(`otp-request:${getRequestClientKey(request)}`, 5, 10 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many OTP requests. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const { email, mode } = await request.json() as { email?: string; mode?: "login" | "signup" };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "Email verification is not configured." }, { status: 503 });

  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: mode === "signup" },
  });

  if (error) {
    const message = error.message.toLowerCase().includes("signups not allowed") || error.message.toLowerCase().includes("user not found")
      ? "No verified account exists for this email. Sign up first."
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
