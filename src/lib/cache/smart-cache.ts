/**
 * Smart Cache Strategy — Solaris World-Class (#34)
 *
 * Different data needs different cache strategies.
 * Supports TTL, stale-while-revalidate, and tag-based invalidation.
 */

import { logger } from '@/lib/utils/logger'

interface CacheOptions {
  ttlSeconds: number
  staleWhileRevalidate?: boolean
  tags?: string[]
}

const cache = new Map<string, { data: unknown; expiresAt: number; tags: string[] }>()

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const existing = cache.get(key)
  const now = Date.now()

  // Cache hit and not expired
  if (existing && existing.expiresAt > now) {
    return existing.data as T
  }

  // Stale-while-revalidate: return stale data now, refresh in background
  if (existing && options.staleWhileRevalidate) {
    const staleData = existing.data as T

    fetcher()
      .then((freshData) => {
        cache.set(key, {
          data: freshData,
          expiresAt: now + options.ttlSeconds * 1000,
          tags: options.tags || [],
        })
      })
      .catch((error) => {
        logger.warn('Background cache refresh failed', {
          key,
          error: error instanceof Error ? error.message : String(error),
        })
      })

    return staleData
  }

  // Cache miss — fetch fresh data
  const data = await fetcher()
  cache.set(key, {
    data,
    expiresAt: now + options.ttlSeconds * 1000,
    tags: options.tags || [],
  })
  return data
}

/** Invalidate all cache entries with a specific tag */
export function invalidateByTag(tag: string): void {
  for (const [key, entry] of cache.entries()) {
    if (entry.tags.includes(tag)) {
      cache.delete(key)
    }
  }
  logger.info('Cache invalidated by tag', { tag })
}

/** Invalidate a specific cache key */
export function invalidateKey(key: string): void {
  cache.delete(key)
}

/** Clear entire cache */
export function clearCache(): void {
  cache.clear()
}
