export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    // Client side: always use relative path "" if NEXT_PUBLIC_API_URL is not explicitly set
    return process.env.NEXT_PUBLIC_API_URL || "";
  }
  // Server side: return NEXT_PUBLIC_API_URL, or VERCEL_URL if on Vercel, or localhost
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}
