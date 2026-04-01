/**
 * Solaris API Error Handler
 *
 * Converts Result failures into consistent API responses.
 * Follows the Solaris response format:
 *   Success: { data: T, meta?: { page, limit, total } }
 *   Error:   { error: { code, message } }
 */

import { NextResponse } from 'next/server'
import type { Result, ErrorCode } from './result'
import { codeToStatus } from './result'
import { logger } from './logger'

const log = logger.child({ context: 'api' })

/**
 * Convert a failed Result into a NextResponse.
 *
 * Usage in API routes:
 *   const result = await productService.getById(id)
 *   if (!result.ok) return handleApiError(result)
 *   return apiSuccess(result.data)
 */
export function handleApiError(result: { ok: false; error: string; code: ErrorCode }): NextResponse {
  const status = codeToStatus(result.code)

  // Log server-side for 500s, warn for 4xx
  if (status >= 500) {
    log.error(result.error, { code: result.code })
  } else if (status >= 400) {
    log.warn(result.error, { code: result.code })
  }

  return NextResponse.json(
    { error: { code: result.code, message: result.error } },
    { status }
  )
}

/**
 * Wrap a successful response in the Solaris format.
 *
 * Usage:
 *   return apiSuccess(product)
 *   return apiSuccess(products, { page: 1, limit: 20, total: 156 })
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, status = 200): NextResponse {
  const body: Record<string, unknown> = { data }
  if (meta) body.meta = meta
  return NextResponse.json(body, { status })
}

/**
 * Wrap a created response (201) in the Solaris format.
 */
export function apiCreated<T>(data: T): NextResponse {
  return apiSuccess(data, undefined, 201)
}

/**
 * Catch-all error handler for unexpected errors in API routes.
 *
 * Usage:
 *   export async function GET(request: NextRequest) {
 *     try { ... } catch (error) { return apiCatchAll(error, 'products:get') }
 *   }
 */
export function apiCatchAll(error: unknown, context: string): NextResponse {
  const message = error instanceof Error ? error.message : String(error)
  log.error(`Unhandled error in ${context}`, { error: message })

  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )
}
