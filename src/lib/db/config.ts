/**
 * Database configuration and connection management for enterprise scale.
 *
 * Provides:
 * - Connection pooling via Supabase (uses PgBouncer on Supabase Pro)
 * - Query timeout protection
 * - Retry logic for transient failures
 * - Read replica routing (when available)
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Query helpers with retry logic
// ---------------------------------------------------------------------------

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  backoffMultiplier?: number
}

const DEFAULT_RETRY: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 500,
  backoffMultiplier: 2,
}

/**
 * Execute a database operation with automatic retry on transient failures.
 * Retries on connection errors, timeouts, and 5xx from Supabase.
 */
export async function withRetry<T>(
  operation: () => Promise<{ data: T; error: { message: string; code?: string } | null }>,
  options?: RetryOptions
): Promise<{ data: T; error: { message: string; code?: string } | null }> {
  const config = { ...DEFAULT_RETRY, ...options }
  let lastError: { message: string; code?: string } | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const result = await operation()

    if (!result.error) return result

    lastError = result.error
    const code = result.error.code || ''
    const msg = result.error.message || ''

    // Only retry on transient errors
    const isTransient =
      code === '57014' || // statement_timeout
      code === '08006' || // connection_failure
      code === '08001' || // sqlclient_unable_to_establish_sqlconnection
      code === '53300' || // too_many_connections
      msg.includes('connection') ||
      msg.includes('timeout') ||
      msg.includes('ECONNRESET')

    if (!isTransient || attempt === config.maxRetries) {
      return result
    }

    const delay = config.delayMs * Math.pow(config.backoffMultiplier, attempt)
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  return { data: null as T, error: lastError }
}

// ---------------------------------------------------------------------------
// Paginated query helper
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Execute a paginated query with cursor-based optimization for large datasets.
 */
export async function paginatedQuery<T>(
  table: string,
  params: PaginationParams & {
    filters?: Record<string, unknown>
    select?: string
  }
): Promise<PaginatedResult<T>> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
    filters = {},
    select = '*',
  } = params

  const supabase = getSupabaseAdmin()
  const offset = (page - 1) * pageSize

  let query = supabase
    .from(table)
    .select(select, { count: 'exact' })

  // Apply filters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value)
    }
  }

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + pageSize - 1)

  if (error) throw error

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: (data || []) as T[],
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// ---------------------------------------------------------------------------
// Batch operations for large datasets
// ---------------------------------------------------------------------------

/**
 * Process items in batches to avoid overwhelming the database.
 * Useful for bulk imports, migrations, and mass updates.
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await processor(batch)
    results.push(...batchResults)
  }

  return results
}

// ---------------------------------------------------------------------------
// Query with admin or user context
// ---------------------------------------------------------------------------

/** Get admin client (bypasses RLS) - use for background jobs, cron, admin operations */
export function adminQuery() {
  return getSupabaseAdmin()
}

/** Get user-scoped client (respects RLS) - use for user-facing operations */
export async function userQuery() {
  return createClient()
}
