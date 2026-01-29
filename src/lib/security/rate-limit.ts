import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up expired records periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export interface RateLimitConfig {
  // Maximum number of requests
  limit: number
  // Window size in milliseconds
  windowMs: number
  // Identifier prefix (e.g., 'auth', 'api')
  prefix?: string
  // Custom key generator
  keyGenerator?: (request: NextRequest) => string
  // Skip rate limiting for certain conditions
  skip?: (request: NextRequest) => boolean
  // Custom message
  message?: string
}

export interface RateLimitResult {
  success: boolean
  allowed: boolean // Alias for success for convenience
  remaining: number
  resetTime: number
  identifier: string
  limit: number
  error?: NextResponse
}

/**
 * Default configurations for different endpoint types
 */
export const rateLimitConfigs = {
  // Strict limits for auth endpoints
  auth: {
    limit: 5,
    windowMs: 60 * 1000, // 1 minute
    prefix: 'auth',
    message: 'Too many authentication attempts. Please try again in a minute.'
  },
  // Upload endpoint limits
  upload: {
    limit: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    prefix: 'upload',
    message: 'Too many uploads. Please wait before uploading more files.'
  },
  // Review submission limits
  review: {
    limit: 5,
    windowMs: 60 * 1000, // 1 minute
    prefix: 'review',
    message: 'Too many reviews submitted. Please wait before submitting more.'
  },
  // Order creation limits
  order: {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
    prefix: 'order',
    message: 'Too many order requests. Please slow down.'
  },
  // General API limits
  api: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
    prefix: 'api',
    message: 'Too many requests. Please slow down.'
  },
  // Strict limits for sensitive operations
  sensitive: {
    limit: 3,
    windowMs: 60 * 1000, // 1 minute
    prefix: 'sensitive',
    message: 'Too many attempts. Please try again later.'
  }
}

/**
 * Get client identifier from request (IP address)
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.api
): RateLimitResult {
  // Generate key for this request
  const identifier = config.keyGenerator
    ? config.keyGenerator(request)
    : getClientIdentifier(request)

  // Check if should skip rate limiting
  if (config.skip && config.skip(request)) {
    return {
      success: true,
      allowed: true,
      remaining: config.limit,
      resetTime: Date.now() + config.windowMs,
      identifier,
      limit: config.limit
    }
  }

  const key = `${config.prefix || 'default'}:${identifier}`
  const now = Date.now()

  // Get or create rate limit record
  let record = rateLimitStore.get(key)

  if (!record || record.resetTime < now) {
    // Create new record
    record = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, record)

    return {
      success: true,
      allowed: true,
      remaining: config.limit - 1,
      resetTime: record.resetTime,
      identifier,
      limit: config.limit
    }
  }

  // Increment count
  record.count++

  if (record.count > config.limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)

    return {
      success: false,
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      identifier,
      limit: config.limit,
      error: NextResponse.json(
        {
          error: config.message || 'Too many requests',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000))
          }
        }
      )
    }
  }

  return {
    success: true,
    allowed: true,
    remaining: config.limit - record.count,
    resetTime: record.resetTime,
    identifier,
    limit: config.limit
  }
}

/**
 * Middleware-style rate limiter
 */
export function rateLimit(config: RateLimitConfig = rateLimitConfigs.api) {
  return (request: NextRequest): RateLimitResult => {
    return checkRateLimit(request, config)
  }
}

/**
 * Create rate limiter for a specific endpoint
 */
export function createRateLimiter(config: Partial<RateLimitConfig>) {
  const finalConfig = { ...rateLimitConfigs.api, ...config }
  return (request: NextRequest) => checkRateLimit(request, finalConfig)
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))
  return response
}
