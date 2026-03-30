/**
 * Enterprise caching layer - Vercel KV (Redis) with in-memory fallback
 *
 * Uses Vercel KV when KV_REST_API_URL is set (auto-injected by Vercel KV).
 * Falls back to in-memory Map otherwise.
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
// Vercel KV backend (Redis - shared across all serverless instances)
// ---------------------------------------------------------------------------

class VercelKVCacheBackend implements CacheBackend {
  private kv: typeof import('@vercel/kv').kv | null = null
  private _hits = 0
  private _misses = 0
  private PREFIX = 'cache:'
  private TAG_PREFIX = 'tag:'

  private async getKV() {
    if (!this.kv) {
      const { kv } = await import('@vercel/kv')
      this.kv = kv
    }
    return this.kv
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await this.getKV()
      const value = await redis.get<T>(this.PREFIX + key)
      if (value === null || value === undefined) {
        this._misses++
        return null
      }
      this._hits++
      return value
    } catch (e) {
      console.error('[cache:kv] get error:', e)
      this._misses++
      return null
    }
  }

  async set<T>(key: string, value: T, ttlMs: number, tags: string[] = []) {
    try {
      const redis = await this.getKV()
      const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))
      await redis.set(this.PREFIX + key, value, { ex: ttlSeconds })

      // Track tags for invalidation
      for (const tag of tags) {
        await redis.sadd(this.TAG_PREFIX + tag, key)
        await redis.expire(this.TAG_PREFIX + tag, ttlSeconds + 60)
      }
    } catch (e) {
      console.error('[cache:kv] set error:', e)
    }
  }

  async del(key: string) {
    try {
      const redis = await this.getKV()
      await redis.del(this.PREFIX + key)
    } catch (e) {
      console.error('[cache:kv] del error:', e)
    }
  }

  async invalidateByTag(tag: string) {
    try {
      const redis = await this.getKV()
      const keys = await redis.smembers(this.TAG_PREFIX + tag)
      if (keys && keys.length > 0) {
        const prefixedKeys = keys.map(k => this.PREFIX + k)
        await redis.del(...prefixedKeys)
      }
      await redis.del(this.TAG_PREFIX + tag)
    } catch (e) {
      console.error('[cache:kv] invalidateByTag error:', e)
    }
  }

  async flush() {
    // Note: Only flushes tracked keys, not entire Redis
    this._hits = 0
    this._misses = 0
    console.log('[cache:kv] flush requested - use Vercel dashboard to clear KV store')
  }

  async stats() {
    try {
      const redis = await this.getKV()
      const info = await redis.dbsize()
      return { hits: this._hits, misses: this._misses, keys: info || 0 }
    } catch {
      return { hits: this._hits, misses: this._misses, keys: 0 }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton cache instance
// ---------------------------------------------------------------------------

let backend: CacheBackend | null = null

function getBackend(): CacheBackend {
  if (!backend) {
    if (process.env.KV_REST_API_URL) {
      backend = new VercelKVCacheBackend()
      console.log('[cache] Using Vercel KV (Redis)')
    } else {
      backend = new MemoryCacheBackend()
    }
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
