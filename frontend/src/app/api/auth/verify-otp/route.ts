import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getRequestClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rate = checkRateLimit(`otp-verify:${getRequestClientKey(request)}`, 10, 10 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many verification attempts. Request a new code later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const { email, token } = await request.json() as { email?: string; token?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedToken = token?.trim();
  if (!normalizedEmail || !normalizedToken || !/^\d{6}$/.test(normalizedToken)) {
    return NextResponse.json({ error: "Enter the 6-digit code sent to your email." }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "Email verification is not configured." }, { status: 503 });

  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: normalizedToken, type: "email" });
  if (error || !data.user) return NextResponse.json({ error: "That code is invalid or expired. Request a new code." }, { status: 400 });

  return NextResponse.json({ ok: true, userId: data.user.id, email: data.user.email });
}
