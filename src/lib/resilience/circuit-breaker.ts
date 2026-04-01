/**
 * Circuit Breaker — Solaris World-Class (#30)
 *
 * When an external service starts failing, stop hammering it.
 * Closed (normal) → Open (failing fast) → Half-Open (testing recovery).
 */

import { AppError } from '@/lib/utils/errors'
import { logger } from '@/lib/utils/logger'

type CircuitState = 'closed' | 'open' | 'half-open'

interface CircuitBreakerConfig {
  name: string
  failureThreshold: number
  resetTimeoutMs: number
  halfOpenMaxAttempts: number
}

class CircuitBreaker {
  private state: CircuitState = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private halfOpenAttempts = 0

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime
      if (timeSinceFailure < this.config.resetTimeoutMs) {
        throw new AppError(
          `${this.config.name} circuit is open — service unavailable`,
          503,
          'CIRCUIT_OPEN'
        )
      }
      this.state = 'half-open'
      this.halfOpenAttempts = 0
      logger.info(`${this.config.name} circuit moving to half-open`)
    }

    if (this.state === 'half-open') {
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.state = 'open'
        this.lastFailureTime = Date.now()
        throw new AppError(`${this.config.name} still failing`, 503, 'CIRCUIT_OPEN')
      }
      this.halfOpenAttempts++
    }

    try {
      const result = await operation()
      if (this.state === 'half-open') {
        logger.info(`${this.config.name} circuit recovered — closing`)
      }
      this.state = 'closed'
      this.failureCount = 0
      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = 'open'
        logger.error(`${this.config.name} circuit OPENED after ${this.failureCount} failures`)
      }

      throw error
    }
  }

  getState(): { state: CircuitState; failures: number } {
    return { state: this.state, failures: this.failureCount }
  }
}

// Pre-configured circuit breakers for external services
export const stripeCircuit = new CircuitBreaker({
  name: 'stripe',
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenMaxAttempts: 2,
})

export const emailCircuit = new CircuitBreaker({
  name: 'resend',
  failureThreshold: 3,
  resetTimeoutMs: 60000,
  halfOpenMaxAttempts: 1,
})

export const aiCircuit = new CircuitBreaker({
  name: 'gemini',
  failureThreshold: 3,
  resetTimeoutMs: 45000,
  halfOpenMaxAttempts: 1,
})

export { CircuitBreaker }
