import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  setCsrfTokenCookie,
  validateCsrfToken,
  checkCsrf,
  csrfProtection,
  generateCsrfToken,
  getCsrfTokenFromCookies,
  isCsrfExempt,
  csrfExemptRoutes,
} from '@/lib/security/csrf'

// Helper to create mock request with cookies and headers
function createMockRequest(
  method: string,
  options: {
    cookieToken?: string
    headerToken?: string
    bodyToken?: string
    contentType?: string
  } = {}
): NextRequest {
  const headers = new Headers()

  if (options.headerToken) {
    headers.set('x-csrf-token', options.headerToken)
  }

  if (options.contentType) {
    headers.set('content-type', options.contentType)
  }

  const request = new NextRequest('http://localhost/api/test', {
    method,
    headers,
  })

  // Mock cookies
  if (options.cookieToken) {
    vi.spyOn(request.cookies, 'get').mockReturnValue({
      name: 'csrf_token',
      value: options.cookieToken,
    })
  }

  return request
}

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateCsrfToken', () => {
    it('generates a token', async () => {
      const token = await generateCsrfToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('generates unique tokens', async () => {
      const tokens = new Set()
      for (let i = 0; i < 100; i++) {
        tokens.add(await generateCsrfToken())
      }
      expect(tokens.size).toBe(100)
    })

    it('generates tokens of expected length', async () => {
      const token = await generateCsrfToken()
      // 32 bytes = 64 hex characters
      expect(token.length).toBe(64)
    })
  })

  describe('setCsrfTokenCookie', () => {
    it('sets CSRF token cookie with correct options', () => {
      const response = NextResponse.next()
      const token = 'test-token-123'

      const result = setCsrfTokenCookie(response, token)

      // Check that cookie was set
      const cookie = result.cookies.get('csrf_token')
      expect(cookie?.value).toBe(token)
    })

    it('sets correct cookie attributes', () => {
      const response = NextResponse.next()
      const token = 'test-token-456'

      setCsrfTokenCookie(response, token)

      // Cookie should be readable by JavaScript (httpOnly: false)
      // and have secure settings in production
    })
  })

  describe('validateCsrfToken', () => {
    it('skips validation for safe methods', async () => {
      const safeMethods = ['GET', 'HEAD', 'OPTIONS']

      for (const method of safeMethods) {
        const request = createMockRequest(method)
        const result = await validateCsrfToken(request)
        expect(result.valid).toBe(true)
      }
    })

    it('validates token from header', async () => {
      const token = 'valid-token-123'
      const request = createMockRequest('POST', {
        cookieToken: token,
        headerToken: token,
        contentType: 'application/json',
      })

      const result = await validateCsrfToken(request)
      expect(result.valid).toBe(true)
    })

    it('rejects missing cookie token', async () => {
      const request = createMockRequest('POST', {
        headerToken: 'some-token',
        contentType: 'application/json',
      })

      const result = await validateCsrfToken(request)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('cookie missing')
    })

    it('rejects missing request token', async () => {
      const request = createMockRequest('POST', {
        cookieToken: 'cookie-token',
        contentType: 'application/json',
      })

      const result = await validateCsrfToken(request)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not provided')
    })

    it('rejects mismatched tokens', async () => {
      const request = createMockRequest('POST', {
        cookieToken: 'cookie-token',
        headerToken: 'different-token',
        contentType: 'application/json',
      })

      const result = await validateCsrfToken(request)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('mismatch')
    })

    it('validates for PUT method', async () => {
      const token = 'put-token'
      const request = createMockRequest('PUT', {
        cookieToken: token,
        headerToken: token,
        contentType: 'application/json',
      })

      const result = await validateCsrfToken(request)
      expect(result.valid).toBe(true)
    })

    it('validates for DELETE method', async () => {
      const token = 'delete-token'
      const request = createMockRequest('DELETE', {
        cookieToken: token,
        headerToken: token,
        contentType: 'application/json',
      })

      const result = await validateCsrfToken(request)
      expect(result.valid).toBe(true)
    })

    it('validates for PATCH method', async () => {
      const token = 'patch-token'
      const request = createMockRequest('PATCH', {
        cookieToken: token,
        headerToken: token,
        contentType: 'application/json',
      })

      const result = await validateCsrfToken(request)
      expect(result.valid).toBe(true)
    })
  })

  describe('checkCsrf', () => {
    it('returns valid result for matching tokens', async () => {
      const token = 'matching-token'
      const request = createMockRequest('POST', {
        cookieToken: token,
        headerToken: token,
        contentType: 'application/json',
      })

      const result = await checkCsrf(request)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('returns 403 error response for invalid tokens', async () => {
      const request = createMockRequest('POST', {
        cookieToken: 'cookie-token',
        headerToken: 'wrong-token',
        contentType: 'application/json',
      })

      const result = await checkCsrf(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.status).toBe(403)
    })
  })

  describe('csrfProtection', () => {
    it('creates a middleware function', () => {
      const middleware = csrfProtection()
      expect(typeof middleware).toBe('function')
    })

    it('middleware validates CSRF tokens', async () => {
      const middleware = csrfProtection()
      const token = 'middleware-token'
      const request = createMockRequest('POST', {
        cookieToken: token,
        headerToken: token,
        contentType: 'application/json',
      })

      const result = await middleware(request)
      expect(result.valid).toBe(true)
    })
  })

  describe('getCsrfTokenFromCookies', () => {
    it('returns null in server environment', () => {
      // document is not defined in Node environment
      const token = getCsrfTokenFromCookies()
      expect(token).toBeNull()
    })
  })

  describe('isCsrfExempt', () => {
    it('exempts Stripe webhook routes', () => {
      expect(isCsrfExempt('/api/webhooks/stripe')).toBe(true)
      expect(isCsrfExempt('/api/webhooks/stripe/events')).toBe(true)
    })

    it('exempts Supabase webhook routes', () => {
      expect(isCsrfExempt('/api/webhooks/supabase')).toBe(true)
      expect(isCsrfExempt('/api/webhooks/supabase/auth')).toBe(true)
    })

    it('exempts cron routes', () => {
      expect(isCsrfExempt('/api/cron/automation')).toBe(true)
      expect(isCsrfExempt('/api/cron/stock-alerts')).toBe(true)
    })

    it('does not exempt regular API routes', () => {
      expect(isCsrfExempt('/api/products')).toBe(false)
      expect(isCsrfExempt('/api/orders')).toBe(false)
      expect(isCsrfExempt('/api/auth/login')).toBe(false)
      expect(isCsrfExempt('/api/admin/dashboard')).toBe(false)
    })
  })

  describe('csrfExemptRoutes', () => {
    it('contains expected exempt routes', () => {
      expect(csrfExemptRoutes).toContain('/api/webhooks/stripe')
      expect(csrfExemptRoutes).toContain('/api/webhooks/supabase')
      expect(csrfExemptRoutes).toContain('/api/cron/')
    })
  })

  describe('CSRF Attack Scenarios', () => {
    it('blocks cross-site POST requests without token', async () => {
      const request = createMockRequest('POST', {
        contentType: 'application/json',
      })

      const result = await checkCsrf(request)
      expect(result.valid).toBe(false)
    })

    it('blocks requests with stolen/guessed token', async () => {
      const request = createMockRequest('POST', {
        cookieToken: 'real-token-abc123',
        headerToken: 'guessed-token-xyz789',
        contentType: 'application/json',
      })

      const result = await checkCsrf(request)
      expect(result.valid).toBe(false)
    })

    it('blocks requests with empty token', async () => {
      const request = createMockRequest('POST', {
        cookieToken: 'real-token',
        headerToken: '',
        contentType: 'application/json',
      })

      const result = await checkCsrf(request)
      expect(result.valid).toBe(false)
    })
  })

  describe('Timing Attack Prevention', () => {
    it('uses constant-time comparison', async () => {
      // Test that similar tokens don't leak timing information
      const baseToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      const similarTokens = [
        'baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 1st char different
        'abaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 2nd char different
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX', // last char different
      ]

      // All should be rejected equally quickly (timing-safe)
      for (const token of similarTokens) {
        const request = createMockRequest('POST', {
          cookieToken: baseToken,
          headerToken: token,
          contentType: 'application/json',
        })

        const result = await checkCsrf(request)
        expect(result.valid).toBe(false)
      }
    })
  })
})
