import { getApiUrl } from "./api";

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${path}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(10000),
      next: { revalidate: 60, ...options.next },
    });
    
    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`API non-200: ${response.status} at ${url}`);
      }
      return null;
    }
    
    return await response.json() as T;
  } catch (error: any) {
    if (error?.name !== 'AbortError' && error?.name !== 'TimeoutError') {
      console.warn(`API fetch warning at ${url}:`, error?.message || error);
    }
    return null;
  }
}
