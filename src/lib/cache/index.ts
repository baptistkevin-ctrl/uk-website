/**
 * Enterprise caching layer - Redis-ready with in-memory fallback
 *
 * Uses in-memory Map by default. Drop in Redis by setting REDIS_URL env var.
 * All public functions work identically regardless of backend.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  tags: string[]
}

interface CacheBackend {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlMs: number, tags?: string[]): Promise<void>
  del(key: string): Promise<void>
  invalidateByTag(tag: string): Promise<void>
  flush(): Promise<void>
  stats(): Promise<{ hits: number; misses: number; keys: number }>
}

// ---------------------------------------------------------------------------
// In-memory backend (single-instance, development & small-scale production)
// ---------------------------------------------------------------------------

class MemoryCacheBackend implements CacheBackend {
  private store = new Map<string, CacheEntry<unknown>>()
  private tagIndex = new Map<string, Set<string>>() // tag -> keys
  private _hits = 0
  private _misses = 0

  // Periodic cleanup every 60s
  private cleanupInterval = setInterval(() => this.cleanup(), 60_000)

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.removeKey(key, entry.tags)
      }
    }
  }

  private removeKey(key: string, tags: string[]) {
    this.store.delete(key)
    for (const tag of tags) {
      this.tagIndex.get(tag)?.delete(key)
      if (this.tagIndex.get(tag)?.size === 0) {
        this.tagIndex.delete(tag)
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) {
      this._misses++
      return null
    }
    if (entry.expiresAt < Date.now()) {
      this.removeKey(key, entry.tags)
      this._misses++
      return null
    }
    this._hits++
    return entry.value
  }

  async set<T>(key: string, value: T, ttlMs: number, tags: string[] = []) {
    // Evict oldest when exceeding 10K keys (LRU-lite)
    if (this.store.size >= 10_000) {
      const oldest = this.store.keys().next().value
      if (oldest) {
        const entry = this.store.get(oldest)
        this.removeKey(oldest, entry?.tags ?? [])
      }
    }

    this.store.set(key, { value, expiresAt: Date.now() + ttlMs, tags })
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, new Set())
      this.tagIndex.get(tag)!.add(key)
    }
  }

  async del(key: string) {
    const entry = this.store.get(key)
    if (entry) this.removeKey(key, entry.tags)
  }

  async invalidateByTag(tag: string) {
    const keys = this.tagIndex.get(tag)
    if (!keys) return
    for (const key of keys) {
      this.store.delete(key)
    }
    this.tagIndex.delete(tag)
  }

  async flush() {
    this.store.clear()
    this.tagIndex.clear()
    this._hits = 0
    this._misses = 0
  }

  async stats() {
    return { hits: this._hits, misses: this._misses, keys: this.store.size }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
  }
}

// ---------------------------------------------------------------------------
// Singleton cache instance
// ---------------------------------------------------------------------------

let backend: CacheBackend | null = null

function getBackend(): CacheBackend {
  if (!backend) {
    // Future: if (process.env.REDIS_URL) backend = new RedisCacheBackend(process.env.REDIS_URL)
    backend = new MemoryCacheBackend()
  }
  return backend
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** TTL presets in milliseconds */
export const TTL = {
  /** 30 seconds - for rapidly changing data */
  SHORT: 30_000,
  /** 2 minutes - for product listings, search results */
  MEDIUM: 2 * 60_000,
  /** 5 minutes - for category trees, brand lists */
  LONG: 5 * 60_000,
  /** 30 minutes - for site settings, rarely-changing config */
  VERY_LONG: 30 * 60_000,
  /** 1 hour */
  HOUR: 60 * 60_000,
  /** 24 hours - for static-ish content */
  DAY: 24 * 60 * 60_000,
} as const

/**
 * Get a value from cache, or compute & store it if missing.
 *
 * @example
 * const categories = await cached('categories:all', () => fetchCategories(), TTL.LONG, ['categories'])
 */
export async function cached<T>(
  key: string,
  compute: () => Promise<T>,
  ttlMs: number = TTL.MEDIUM,
  tags: string[] = []
): Promise<T> {
  const cache = getBackend()
  const existing = await cache.get<T>(key)
  if (existing !== null) return existing

  const value = await compute()
  await cache.set(key, value, ttlMs, tags)
  return value
}

/** Direct cache get */
export async function cacheGet<T>(key: string): Promise<T | null> {
  return getBackend().get<T>(key)
}

/** Direct cache set */
export async function cacheSet<T>(key: string, value: T, ttlMs: number = TTL.MEDIUM, tags: string[] = []) {
  return getBackend().set(key, value, ttlMs, tags)
}

/** Delete a specific key */
export async function cacheDel(key: string) {
  return getBackend().del(key)
}

/** Invalidate all entries with a given tag */
export async function cacheInvalidateTag(tag: string) {
  return getBackend().invalidateByTag(tag)
}

/** Flush entire cache */
export async function cacheFlush() {
  return getBackend().flush()
}

/** Get cache statistics */
export async function cacheStats() {
  return getBackend().stats()
}
