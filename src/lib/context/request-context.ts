/**
 * Request Context Propagation — Solaris World-Class (#24)
 *
 * Every log entry, every database query, every external call
 * automatically carries context about the request that triggered it.
 * Uses AsyncLocalStorage for zero-cost propagation.
 */

import { AsyncLocalStorage } from 'async_hooks'

export interface RequestContext {
  requestId: string
  userId?: string
  userRole?: string
  path: string
  method: string
  ip?: string
  startTime: number
  traceId?: string
}

const contextStore = new AsyncLocalStorage<RequestContext>()

export function getContext(): RequestContext | undefined {
  return contextStore.getStore()
}

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return contextStore.run(context, fn)
}

/**
 * Create a new request context from a request.
 * Call this at the start of every API route or middleware.
 */
export function createRequestContext(params: {
  path: string
  method: string
  ip?: string
  userId?: string
  userRole?: string
  traceId?: string
}): RequestContext {
  return {
    requestId: `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    path: params.path,
    method: params.method,
    ip: params.ip,
    userId: params.userId,
    userRole: params.userRole,
    startTime: Date.now(),
    traceId: params.traceId || `trc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  }
}
