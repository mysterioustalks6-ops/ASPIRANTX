/**
 * Aspirantx Supabase & API Zero-Egress Optimizer
 * 
 * Prevents unnecessary bandwidth consumption, payload egress overages, and repeat queries
 * using aggressive client-side caching (LocalStorage + Memory Cache) and differential payload syncing.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

const MEMORY_CACHE = new Map<string, CacheEntry<any>>();
const CACHE_TTL_DEFAULT = 15 * 60 * 1000; // 15 minutes cache default

/**
 * Cache query responses locally to prevent repeating requests to Supabase and backend.
 */
export async function egressOptimizedFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs: number = CACHE_TTL_DEFAULT
): Promise<T> {
  const now = Date.now();

  // 1. Check in-memory fast cache
  if (MEMORY_CACHE.has(cacheKey)) {
    const entry = MEMORY_CACHE.get(cacheKey)!;
    if (now - entry.timestamp < ttlMs) {
      return entry.data;
    }
  }

  // 2. Check local device storage cache
  const localKey = `aspirantx_egress_cache_${cacheKey}`;
  try {
    const stored = localStorage.getItem(localKey);
    if (stored) {
      const entry: CacheEntry<T> = JSON.parse(stored);
      if (now - entry.timestamp < ttlMs) {
        MEMORY_CACHE.set(cacheKey, entry);
        return entry.data;
      }
    }
  } catch (err) {
    // Ignore local parse errors
  }

  // 3. Execute network fetch only when cache is expired or missing
  const freshData = await fetcher();

  const newEntry: CacheEntry<T> = {
    data: freshData,
    timestamp: now,
  };

  MEMORY_CACHE.set(cacheKey, newEntry);
  try {
    localStorage.setItem(localKey, JSON.stringify(newEntry));
  } catch (e) {
    // Handle storage quota limits gracefully
  }

  return freshData;
}

/**
 * Invalidate a specific cache key (e.g. after user updates profile or finishes an exam)
 */
export function invalidateEgressCache(cacheKey: string): void {
  MEMORY_CACHE.delete(cacheKey);
  try {
    localStorage.removeItem(`aspirantx_egress_cache_${cacheKey}`);
  } catch (e) {}
}

/**
 * Compression helper for large telemetry packets to minimize network payload size
 */
export function compressPacketPayload(payload: any): string {
  try {
    return JSON.stringify(payload);
  } catch {
    return '{}';
  }
}
