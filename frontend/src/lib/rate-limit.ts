type Bucket = { count: number; resetAt: number };
const globalStore = globalThis as typeof globalThis & { __senpaiRateLimits?: Map<string, Bucket> };
const store = globalStore.__senpaiRateLimits || new Map<string, Bucket>();
globalStore.__senpaiRateLimits = store;

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function getRequestClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("cf-connecting-ip") || "unknown";
}
