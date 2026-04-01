/**
 * Structured Error Context — Solaris World-Class (#36)
 *
 * Every error carries full context about what was happening
 * when it occurred. Debug any error in 30 seconds.
 */

import { AppError } from './errors'
import { logger } from './logger'
import { getContext } from '@/lib/context/request-context'

interface ErrorContext {
  operation: string
  entity?: string
  entityId?: string
  input?: Record<string, unknown>
  userId?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

export class ContextualError extends AppError {
  public context: ErrorContext

  constructor(
    message: string,
    statusCode: number,
    code: string,
    context: ErrorContext
  ) {
    super(message, statusCode, code)
    this.name = 'ContextualError'
    this.context = context

    // Auto-enrich with request context if available
    const reqCtx = getContext()
    if (reqCtx) {
      this.context.requestId = this.context.requestId || reqCtx.requestId
      this.context.userId = this.context.userId || reqCtx.userId
    }

    // Auto-log with full context
    logger.error(message, {
      code,
      statusCode,
      ...context,
    })
  }
}
