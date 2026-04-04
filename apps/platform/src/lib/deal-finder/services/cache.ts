interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Simple LRU-style in-memory cache with TTL.
 * Same URL within 1hr returns cached result.
 */
export class ScrapeCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 500, ttlMs = 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiry: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
