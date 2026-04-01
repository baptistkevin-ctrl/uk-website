/**
 * Request Deduplication — Solaris World-Class (#35)
 *
 * When 100 users request the same data at the same time,
 * collapse them into ONE query. Prevents thundering herd.
 */

import { logger } from '@/lib/utils/logger'

const inflightRequests = new Map<string, Promise<unknown>>()

export async function dedup<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // If this exact request is already in-flight, wait for it
  const existing = inflightRequests.get(key) as Promise<T> | undefined
  if (existing) {
    logger.debug('Request deduplicated', { key })
    return existing
  }

  // First request — execute it
  const promise = fetcher().finally(() => {
    inflightRequests.delete(key)
  })

  inflightRequests.set(key, promise)
  return promise
}
