/**
 * Self-Healing Operations — Solaris World-Class (#23)
 *
 * Detect failures and auto-recover with retry, compensation,
 * and fallback strategies. Unlike standard retry, this VERIFIES
 * the result and can COMPENSATE for partial failures.
 */

import { ok, fail } from '@/lib/utils/result'
import type { Result } from '@/lib/utils/result'
import { logger } from '@/lib/utils/logger'

interface HealableOperation<T> {
  name: string
  execute: () => Promise<T>
  verify: (result: T) => boolean | Promise<boolean>
  compensate?: () => Promise<void>
  fallback?: () => Promise<T>
  maxAttempts?: number
  backoffMs?: number
  onHeal?: (attempt: number, error: Error) => void
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function selfHeal<T>(op: HealableOperation<T>): Promise<Result<T>> {
  const maxAttempts = op.maxAttempts ?? 3
  const backoffMs = op.backoffMs ?? 500
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await op.execute()

      // VERIFY it actually worked (not just no error)
      const isValid = await op.verify(result)
      if (isValid) return ok(result)

      // Operation "succeeded" but verification failed
      logger.warn(`${op.name} completed but verification failed`, { attempt })

      if (op.compensate) {
        await op.compensate()
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      logger.warn(`${op.name} failed, self-healing`, {
        attempt,
        maxAttempts,
        error: lastError.message,
      })
      op.onHeal?.(attempt, lastError)
    }

    // Exponential backoff with jitter
    if (attempt < maxAttempts) {
      const jitter = Math.random() * 200
      await sleep(backoffMs * Math.pow(2, attempt - 1) + jitter)
    }
  }

  // All retries exhausted — try fallback
  if (op.fallback) {
    try {
      logger.info(`${op.name} using fallback strategy`)
      const fallbackResult = await op.fallback()
      return ok(fallbackResult)
    } catch {
      // Fallback also failed
    }
  }

  return fail(
    `${op.name} failed after ${maxAttempts} attempts: ${lastError?.message || 'unknown'}`,
    'INTERNAL_ERROR'
  )
}
