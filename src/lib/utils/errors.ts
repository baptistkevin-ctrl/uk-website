/**
 * AppError Class Hierarchy — Solaris Error System
 *
 * Custom error classes for structured error handling.
 * Used by services to throw typed errors that API routes
 * convert to proper HTTP responses via handleApiError().
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      404,
      'NOT_FOUND'
    )
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 422, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 429, 'RATE_LIMITED', retryAfter ? { retryAfter } : undefined)
    this.name = 'RateLimitError'
  }
}

/**
 * Convert any error into a safe NextResponse.
 * AppError subclasses map directly to HTTP status codes.
 * ZodError maps to 422 with field-level details.
 * Unknown errors return generic 500.
 */
export function handleAppError(error: unknown): NextResponse {
  // AppError hierarchy — structured response
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      },
      { status: error.statusCode }
    )
  }

  // Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> }
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: zodError.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      { status: 422 }
    )
  }

  // Unknown errors — log full details, return safe message
  logger.error('Unhandled error', {
    error: error instanceof Error ? error.message : 'Unknown',
    stack: error instanceof Error ? error.stack : undefined,
  })

  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )
}
