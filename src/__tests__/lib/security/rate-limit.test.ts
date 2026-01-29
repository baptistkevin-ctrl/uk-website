import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  checkRateLimit,
  rateLimit,
  createRateLimiter,
  addRateLimitHeaders,
  rateLimitConfigs,
} from '@/lib/security/rate-limit'

// Helper to create mock request
function createMockRequest(ip = '127.0.0.1', path = '/api/test'): NextRequest {
  const url = `http://localhost${path}`
  const request = new NextRequest(url, {
    headers: new Headers({
      'x-forwarded-for': ip,
    }),
  })
  return request
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rateLimitConfigs', () => {
    it('has correct auth config', () => {
      expect(rateLimitConfigs.auth.limit).toBe(5)
      expect(rateLimitConfigs.auth.windowMs).toBe(60 * 1000)
      expect(rateLimitConfigs.auth.prefix).toBe('auth')
    })

    it('has correct upload config', () => {
      expect(rateLimitConfigs.upload.limit).toBe(10)
      expect(rateLimitConfigs.upload.windowMs).toBe(5 * 60 * 1000)
    })

    it('has correct api config', () => {
      expect(rateLimitConfigs.api.limit).toBe(100)
      expect(rateLimitConfigs.api.windowMs).toBe(60 * 1000)
    })

    it('has correct sensitive config', () => {
      expect(rateLimitConfigs.sensitive.limit).toBe(3)
      expect(rateLimitConfigs.sensitive.windowMs).toBe(60 * 1000)
    })
  })

  describe('checkRateLimit', () => {
    it('allows requests under the limit', () => {
      const request = createMockRequest('192.168.1.1')
      const config = { limit: 5, windowMs: 60000, prefix: 'test1' }

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(request, config)
        expect(result.success).toBe(true)
        expect(result.allowed).toBe(true)
      }
    })

    it('blocks requests over the limit', () => {
      const request = createMockRequest('192.168.1.2')
      const config = { limit: 3, windowMs: 60000, prefix: 'test2' }

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        checkRateLimit(request, config)
      }

      // 4th request should be blocked
      const result = checkRateLimit(request, config)
      expect(result.success).toBe(false)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.error).toBeDefined()
    })

    it('returns correct remaining count', () => {
      const request = createMockRequest('192.168.1.3')
      const config = { limit: 5, windowMs: 60000, prefix: 'test3' }

      let result = checkRateLimit(request, config)
      expect(result.remaining).toBe(4)

      result = checkRateLimit(request, config)
      expect(result.remaining).toBe(3)

      result = checkRateLimit(request, config)
      expect(result.remaining).toBe(2)
    })

    it('resets after window expires', () => {
      const request = createMockRequest('192.168.1.4')
      const config = { limit: 2, windowMs: 60000, prefix: 'test4' }

      // Use up the limit
      checkRateLimit(request, config)
      checkRateLimit(request, config)
      let result = checkRateLimit(request, config)
      expect(result.allowed).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(61000)

      // Should be allowed again
      result = checkRateLimit(request, config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('tracks different IPs separately', () => {
      const request1 = createMockRequest('10.0.0.1')
      const request2 = createMockRequest('10.0.0.2')
      const config = { limit: 2, windowMs: 60000, prefix: 'test5' }

      // Use up limit for IP 1
      checkRateLimit(request1, config)
      checkRateLimit(request1, config)
      expect(checkRateLimit(request1, config).allowed).toBe(false)

      // IP 2 should still be allowed
      expect(checkRateLimit(request2, config).allowed).toBe(true)
    })

    it('respects skip function', () => {
      const request = createMockRequest('192.168.1.5')
      const config = {
        limit: 1,
        windowMs: 60000,
        prefix: 'test6',
        skip: () => true,
      }

      // Should always be allowed when skip returns true
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(request, config)
        expect(result.allowed).toBe(true)
      }
    })

    it('uses custom key generator', () => {
      const request = createMockRequest('192.168.1.6')
      const config = {
        limit: 2,
        windowMs: 60000,
        prefix: 'test7',
        keyGenerator: () => 'custom-key',
      }

      // All requests use the same key
      checkRateLimit(request, config)
      checkRateLimit(request, config)
      expect(checkRateLimit(request, config).allowed).toBe(false)
    })

    it('returns 429 error response when blocked', () => {
      const request = createMockRequest('192.168.1.7')
      const config = { limit: 1, windowMs: 60000, prefix: 'test8' }

      checkRateLimit(request, config)
      const result = checkRateLimit(request, config)

      expect(result.error).toBeDefined()
      expect(result.error?.status).toBe(429)
    })
  })

  describe('rateLimit', () => {
    it('creates a rate limiter function', () => {
      const limiter = rateLimit(rateLimitConfigs.api)
      const request = createMockRequest('192.168.2.1')

      const result = limiter(request)
      expect(result.success).toBe(true)
      expect(result.limit).toBe(100)
    })
  })

  describe('createRateLimiter', () => {
    it('creates custom rate limiter with merged config', () => {
      const limiter = createRateLimiter({ limit: 50, prefix: 'custom' })
      const request = createMockRequest('192.168.3.1')

      const result = limiter(request)
      expect(result.limit).toBe(50)
    })
  })

  describe('addRateLimitHeaders', () => {
    it('adds rate limit headers to response', () => {
      const response = new Response()
      const nextResponse = {
        headers: response.headers,
      } as any

      const result = {
        success: true,
        allowed: true,
        remaining: 45,
        resetTime: Date.now() + 60000,
        identifier: 'test',
        limit: 50,
      }

      addRateLimitHeaders(nextResponse, result)

      expect(nextResponse.headers.get('X-RateLimit-Limit')).toBe('50')
      expect(nextResponse.headers.get('X-RateLimit-Remaining')).toBe('45')
      expect(nextResponse.headers.get('X-RateLimit-Reset')).toBeDefined()
    })
  })

  describe('Rate Limit Scenarios', () => {
    it('handles auth endpoint rate limiting', () => {
      const request = createMockRequest('10.0.1.1', '/api/auth/login')

      // Auth limit is 5 per minute
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(request, rateLimitConfigs.auth)
        expect(result.allowed).toBe(true)
      }

      const blocked = checkRateLimit(request, rateLimitConfigs.auth)
      expect(blocked.allowed).toBe(false)
    })

    it('handles upload endpoint rate limiting', () => {
      const request = createMockRequest('10.0.1.2', '/api/upload')

      // Upload limit is 10 per 5 minutes
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(request, rateLimitConfigs.upload)
        expect(result.allowed).toBe(true)
      }

      const blocked = checkRateLimit(request, rateLimitConfigs.upload)
      expect(blocked.allowed).toBe(false)
    })

    it('handles burst traffic', () => {
      const config = { limit: 10, windowMs: 1000, prefix: 'burst' }

      // Simulate burst of 20 requests from same IP
      const results = []
      for (let i = 0; i < 20; i++) {
        const request = createMockRequest('10.0.1.3')
        results.push(checkRateLimit(request, config))
      }

      const allowed = results.filter(r => r.allowed).length
      const blocked = results.filter(r => !r.allowed).length

      expect(allowed).toBe(10)
      expect(blocked).toBe(10)
    })
  })

  describe('IP Extraction', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: new Headers({
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
        }),
      })

      const config = { limit: 100, windowMs: 60000, prefix: 'ip-test' }
      const result = checkRateLimit(request, config)

      // Should use the first IP in the chain
      expect(result.identifier).toBe('203.0.113.195')
    })

    it('extracts IP from x-real-ip header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: new Headers({
          'x-real-ip': '192.0.2.1',
        }),
      })

      const config = { limit: 100, windowMs: 60000, prefix: 'ip-test2' }
      const result = checkRateLimit(request, config)

      expect(result.identifier).toBe('192.0.2.1')
    })

    it('falls back to unknown when no IP headers', () => {
      const request = new NextRequest('http://localhost/api/test')

      const config = { limit: 100, windowMs: 60000, prefix: 'ip-test3' }
      const result = checkRateLimit(request, config)

      expect(result.identifier).toBe('unknown')
    })
  })
})
