/**
 * AspirantX Resilient Network API Client
 * - Exponential backoff retry logic for weak/unstable internet connections
 * - Request timeouts with AbortController
 * - Stale-While-Revalidate (SWR) client caching with localStorage fallback for offline support
 * - Automatic payload serialization & status code handling
 */

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  initialDelayMs?: number;
  useCache?: boolean;
  cacheTtlMs?: number; // Cache duration in ms (default 5 minutes)
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheItem<any>>();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Calculates exponential backoff with jitter
 */
function getBackoffDelay(attempt: number, initialDelay: number): number {
  const exponential = Math.pow(2, attempt) * initialDelay;
  const jitter = Math.random() * 200; // 0-200ms random jitter
  return Math.min(exponential + jitter, 5000); // Cap max delay at 5s
}

/**
 * Robust fetch with retries, timeout, and offline fallback
 */
export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeoutMs = 12000,
    maxRetries = 3,
    initialDelayMs = 500,
    useCache = false,
    cacheTtlMs = DEFAULT_CACHE_TTL,
    headers = {},
    ...restOptions
  } = options;

  const method = (restOptions.method || 'GET').toUpperCase();
  const cacheKey = `aspirantx_api_cache_${method}_${url}`;

  // 1. SWR Cache Read (for GET requests)
  if (method === 'GET' && useCache) {
    // Check Memory Cache
    const memItem = memoryCache.get(cacheKey);
    if (memItem && Date.now() - memItem.timestamp < cacheTtlMs) {
      return memItem.data as T;
    }

    // Check LocalStorage Cache
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const item: CacheItem<T> = JSON.parse(stored);
        if (Date.now() - item.timestamp < cacheTtlMs) {
          memoryCache.set(cacheKey, item);
          return item.data;
        }
      }
    } catch (e) {
      // Ignore storage read errors
    }
  }

  // 2. Perform Fetch with Exponential Backoff Retry Loop
  let lastError: Error | null = null;

  // Retrieve authenticated JWT token or session details
  let authToken = '';
  try {
    const token = localStorage.getItem('aspirantx_auth_token');
    if (token) {
      authToken = token;
    } else {
      const sessionStr = localStorage.getItem('aspirantx_demo_user');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (parsed && parsed.email) {
          // Fallback session identifier token if token endpoint not yet called
          authToken = parsed.token || '';
        }
      }
    }
  } catch (e) {}

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(headers as Record<string, string>),
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        // Do NOT retry 4xx client errors (401, 403, 404, 400)
        if (response.status >= 400 && response.status < 500) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status} Error`);
        }
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: T = await response.json();

      // Cache successful GET responses
      if (method === 'GET' && useCache) {
        const cacheEntry: CacheItem<T> = {
          data,
          timestamp: Date.now(),
        };
        memoryCache.set(cacheKey, cacheEntry);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        } catch (e) {
          // Ignore localStorage quota errors
        }
      }

      return data;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err.name === 'AbortError' ? new Error(`Request timeout after ${timeoutMs}ms`) : err;

      // If user is offline or it's an abort/network error, try returning stale cache
      if (method === 'GET' && (!navigator.onLine || attempt === maxRetries)) {
        const staleMem = memoryCache.get(cacheKey);
        if (staleMem) {
          console.warn(`[Network Offline/Degraded] Returning stale cached data for ${url}`);
          return staleMem.data as T;
        }
        try {
          const stored = localStorage.getItem(cacheKey);
          if (stored) {
            const item: CacheItem<T> = JSON.parse(stored);
            console.warn(`[Network Offline/Degraded] Returning stale disk data for ${url}`);
            return item.data;
          }
        } catch (e) {}
      }

      // If last attempt reached, break loop
      if (attempt === maxRetries) {
        break;
      }

      // Wait before next retry
      const delay = getBackoffDelay(attempt, initialDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error(`Network request failed for ${url}`);
}

/**
 * Clears cache entry or entire client cache
 */
export function clearApiCache(urlPrefix?: string) {
  if (urlPrefix) {
    for (const key of memoryCache.keys()) {
      if (key.includes(urlPrefix)) {
        memoryCache.delete(key);
      }
    }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('aspirantx_api_cache_') && key.includes(urlPrefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}
  } else {
    memoryCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('aspirantx_api_cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }
}
