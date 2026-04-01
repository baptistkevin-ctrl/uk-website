/**
 * Idempotency Shield — Solaris World-Class (#26)
 *
 * Every critical operation is safe to execute twice.
 * Network failures and double-clicks cannot cause duplicates.
 * Uses in-memory cache (upgrade to Redis/KV at scale).
 */

import { logger } from '@/lib/utils/logger'
import { ConflictError } from '@/lib/utils/errors'

interface IdempotentOperation<T> {
  /** Unique key for this operation (e.g., `payment:order:${orderId}`) */
  key: string
  /** The actual operation to execute */
  execute: () => Promise<T>
  /** How long to remember results in seconds (default 24h) */
  ttlSeconds?: number
}

// In-memory cache — replace with Redis/Vercel KV in production at scale
const cache = new Map<string, { data: string; expiresAt: number }>()
const locks = new Set<string>()

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) cache.delete(key)
  }
}, 60_000)

export async function idempotent<T>(op: IdempotentOperation<T>): Promise<T> {
  const cacheKey = `idempotent:${op.key}`
  const ttl = (op.ttlSeconds ?? 86400) * 1000

  // Check if we already did this operation
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    logger.info('Idempotent cache hit — returning cached result', { key: op.key })
    return JSON.parse(cached.data) as T
  }

  // Try to acquire lock
  if (locks.has(cacheKey)) {
    throw new ConflictError('Operation in progress, please retry')
  }

  locks.add(cacheKey)

  try {
    const result = await op.execute()

    // Cache the result
    cache.set(cacheKey, {
      data: JSON.stringify(result),
      expiresAt: Date.now() + ttl,
    })

    return result
  } finally {
    locks.delete(cacheKey)
  }
}
