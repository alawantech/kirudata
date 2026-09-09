/**
 * Client-side cache with TTL for reducing redundant API calls.
 * Data is cached per-tab (in-memory). Stale data is evicted on read.
 */

const store = new Map();

export const TTL = {
  NETWORKS: 5 * 60 * 1000,  // 5 min
  PLANS: 1 * 60 * 1000,     // 1 min
  SETTINGS: 2 * 60 * 1000,  // 2 min
  DISCOUNT: 1 * 60 * 1000,  // 1 min
};

export function getCached(key, ttlMs) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data) {
  store.set(key, { data, ts: Date.now() });
}

export function invalidate(key) {
  store.delete(key);
}

export function invalidatePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function invalidateAll() {
  store.clear();
}

/**
 * Fetch with cache — returns cached data if fresh, otherwise fetches + caches.
 */
export async function fetchWithCache(cacheKey, ttlMs, fetcher) {
  const cached = getCached(cacheKey, ttlMs);
  if (cached !== null) return cached;

  const data = await fetcher();
  setCache(cacheKey, data);
  return data;
}
