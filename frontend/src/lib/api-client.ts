import { getApiUrl } from "./api";

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${path}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(3000),
      next: { revalidate: 60, ...options.next },
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${response.statusText} at ${url}`);
      return null;
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`API Fetch Error at ${url}:`, error);
    return null;
  }
}
