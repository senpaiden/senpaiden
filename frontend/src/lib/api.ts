export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    // Client side: return NEXT_PUBLIC_API_URL or relative path ""
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  // Server side: return NEXT_PUBLIC_API_URL, or VERCEL_URL if on Vercel, or empty string
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
