/**
 * Graceful Degradation — Solaris Pattern
 *
 * When external services fail (Stripe, email, AI), the app
 * should still work — just with reduced functionality.
 * Retry with exponential backoff, then fall back if critical=false.
 */

import { logger } from './logger'

interface GracefulOptions<T> {
  /** The async operation to attempt */
  operation: () => Promise<T>
  /** Value to return if all retries fail and critical=false */
  fallback: T
  /** Service name for logging (e.g., "stripe", "resend", "gemini") */
  service: string
  /** If true, throw instead of falling back */
  critical?: boolean
  /** Max wait time per attempt in ms (default 5000) */
  timeoutMs?: number
  /** Number of retries before fallback (default 2) */
  retries?: number
}

export async function graceful<T>(options: GracefulOptions<T>): Promise<T> {
  const {
    operation,
    fallback,
    service,
    critical = false,
    timeoutMs = 5000,
    retries = 2,
  } = options

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${service} timed out`)), timeoutMs)
        ),
      ])
      return result
    } catch (error) {
      const isLastAttempt = attempt === retries

      logger.warn(`${service} failed (attempt ${attempt + 1}/${retries + 1})`, {
        service,
        error: error instanceof Error ? error.message : 'Unknown',
        attempt: attempt + 1,
        willRetry: !isLastAttempt,
      })

      if (isLastAttempt) {
        if (critical) throw error
        logger.error(`${service} degraded — using fallback`, { service })
        return fallback
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)))
    }
  }

  return fallback
}
