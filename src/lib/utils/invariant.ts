/**
 * Invariant Assertions — Solaris Pattern
 *
 * Guard conditions that catch "should never happen" bugs instantly.
 * In development: throws with full details.
 * In production: logs to structured logger and throws generic error.
 *
 * TypeScript narrows the type after invariant() — the asserts keyword
 * tells the compiler the condition is true if we get past the call.
 */

import { logger } from './logger'

export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    const error = new Error(`Invariant violation: ${message}`)
    error.name = 'InvariantError'

    if (process.env.NODE_ENV === 'production') {
      // Log to structured logger (Sentry picks this up)
      logger.error('Invariant violation', { message, stack: error.stack })
    }

    throw error
  }
}
