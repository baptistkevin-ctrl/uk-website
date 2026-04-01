/**
 * The Solaris Result Pattern
 *
 * Functions return Success or Failure instead of throwing.
 * This makes error handling explicit, composable, and impossible to forget.
 *
 * Usage:
 *   const result = await userService.create(data)
 *   if (!result.ok) return handleApiError(result)
 *   return NextResponse.json({ data: result.data })
 */

// Core types
type Success<T> = { ok: true; data: T }
type Failure = { ok: false; error: string; code: ErrorCode }

export type Result<T> = Success<T> | Failure

// Standard error codes — map to HTTP status codes
export type ErrorCode =
  | 'BAD_REQUEST'       // 400
  | 'UNAUTHORIZED'      // 401
  | 'FORBIDDEN'         // 403
  | 'NOT_FOUND'         // 404
  | 'CONFLICT'          // 409
  | 'VALIDATION_ERROR'  // 422
  | 'RATE_LIMITED'      // 429
  | 'INTERNAL_ERROR'    // 500

// Helpers to create results
export function ok<T>(data: T): Success<T> {
  return { ok: true, data }
}

export function fail(error: string, code: ErrorCode = 'INTERNAL_ERROR'): Failure {
  return { ok: false, error, code }
}

// Map error codes to HTTP status codes
export function codeToStatus(code: ErrorCode): number {
  const map: Record<ErrorCode, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION_ERROR: 422,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
  }
  return map[code]
}

/**
 * Wrap an async operation in a Result.
 * Catches thrown errors and returns them as Failure.
 *
 * Usage:
 *   const result = await tryCatch(() => supabase.from('users').select())
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage = 'An unexpected error occurred'
): Promise<Result<T>> {
  try {
    const data = await fn()
    return ok(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // Log full error server-side, return safe message client-side
    console.error(`[tryCatch] ${errorMessage}:`, message)
    return fail(errorMessage, 'INTERNAL_ERROR')
  }
}
