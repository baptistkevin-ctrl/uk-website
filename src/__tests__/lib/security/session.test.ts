import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import {
  getSessionTimeout,
  getMaxSessionAge,
  isSessionTimedOut,
  isSessionExpired,
  secureCookieOptions,
  setSecureSessionCookie,
  clearSessionCookie,
  isSessionInvalidated,
  getClientIp,
  getUserAgent,
} from '@/lib/security/session'

describe('Session Security', () => {
  describe('getSessionTimeout', () => {
    it('returns 30 minutes in milliseconds', () => {
      const timeout = getSessionTimeout()
      expect(timeout).toBe(30 * 60 * 1000) // 30 minutes
    })
  })

  describe('getMaxSessionAge', () => {
    it('returns 24 hours in milliseconds', () => {
      const maxAge = getMaxSessionAge()
      expect(maxAge).toBe(24 * 60 * 60 * 1000) // 24 hours
    })
  })

  describe('isSessionTimedOut', () => {
    it('returns true for null activity', () => {
      expect(isSessionTimedOut(null)).toBe(true)
    })

    it('returns true for activity older than 30 minutes', () => {
      const oldActivity = new Date(Date.now() - 31 * 60 * 1000) // 31 minutes ago
      expect(isSessionTimedOut(oldActivity)).toBe(true)
    })

    it('returns false for recent activity', () => {
      const recentActivity = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      expect(isSessionTimedOut(recentActivity)).toBe(false)
    })

    it('handles string dates', () => {
      const recentActivity = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      expect(isSessionTimedOut(recentActivity)).toBe(false)

      const oldActivity = new Date(Date.now() - 35 * 60 * 1000).toISOString()
      expect(isSessionTimedOut(oldActivity)).toBe(true)
    })

    it('handles edge case at exactly 30 minutes', () => {
      const exactlyTimeout = new Date(Date.now() - 30 * 60 * 1000)
      // At exactly timeout, should not be timed out yet
      expect(isSessionTimedOut(exactlyTimeout)).toBe(false)
    })
  })

  describe('isSessionExpired', () => {
    it('returns true for null created date', () => {
      expect(isSessionExpired(null)).toBe(true)
    })

    it('returns true for sessions older than 24 hours', () => {
      const oldSession = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      expect(isSessionExpired(oldSession)).toBe(true)
    })

    it('returns false for sessions within 24 hours', () => {
      const recentSession = new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      expect(isSessionExpired(recentSession)).toBe(false)
    })

    it('handles string dates', () => {
      const recentSession = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      expect(isSessionExpired(recentSession)).toBe(false)
    })
  })

  describe('secureCookieOptions', () => {
    it('has httpOnly set to true', () => {
      expect(secureCookieOptions.httpOnly).toBe(true)
    })

    it('has sameSite set to strict', () => {
      expect(secureCookieOptions.sameSite).toBe('strict')
    })

    it('has path set to /', () => {
      expect(secureCookieOptions.path).toBe('/')
    })

    it('has maxAge set to 24 hours in seconds', () => {
      expect(secureCookieOptions.maxAge).toBe(24 * 60 * 60)
    })
  })

  describe('setSecureSessionCookie', () => {
    it('sets cookie with secure options', () => {
      const response = NextResponse.next()
      const result = setSecureSessionCookie(response, 'test-cookie', 'test-value')

      const cookie = result.cookies.get('test-cookie')
      expect(cookie?.value).toBe('test-value')
    })
  })

  describe('clearSessionCookie', () => {
    it('clears cookie by setting maxAge to 0', () => {
      const response = NextResponse.next()
      const result = clearSessionCookie(response, 'test-cookie')

      // Cookie should be cleared (empty value, maxAge 0)
      const cookie = result.cookies.get('test-cookie')
      expect(cookie?.value).toBe('')
    })
  })

  describe('isSessionInvalidated', () => {
    it('returns false when invalidatedAt is null', () => {
      const sessionCreated = new Date()
      expect(isSessionInvalidated(sessionCreated, null)).toBe(false)
    })

    it('returns true when session was created before invalidation', () => {
      const sessionCreated = new Date(Date.now() - 60000) // 1 minute ago
      const invalidatedAt = new Date() // Now
      expect(isSessionInvalidated(sessionCreated, invalidatedAt)).toBe(true)
    })

    it('returns false when session was created after invalidation', () => {
      const invalidatedAt = new Date(Date.now() - 60000) // 1 minute ago
      const sessionCreated = new Date() // Now
      expect(isSessionInvalidated(sessionCreated, invalidatedAt)).toBe(false)
    })

    it('handles string dates', () => {
      const sessionCreated = new Date(Date.now() - 60000).toISOString()
      const invalidatedAt = new Date().toISOString()
      expect(isSessionInvalidated(sessionCreated, invalidatedAt)).toBe(true)
    })
  })

  describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '203.0.113.195, 70.41.3.18'
            return null
          },
        },
      } as any

      expect(getClientIp(request)).toBe('203.0.113.195')
    })

    it('extracts IP from x-real-ip header', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '192.0.2.1'
            return null
          },
        },
      } as any

      expect(getClientIp(request)).toBe('192.0.2.1')
    })

    it('returns localhost fallback when no headers', () => {
      const request = {
        headers: {
          get: () => null,
        },
      } as any

      expect(getClientIp(request)).toBe('127.0.0.1')
    })

    it('prefers x-forwarded-for over x-real-ip', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '10.0.0.1'
            if (name === 'x-real-ip') return '10.0.0.2'
            return null
          },
        },
      } as any

      expect(getClientIp(request)).toBe('10.0.0.1')
    })
  })

  describe('getUserAgent', () => {
    it('extracts user agent from header', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'user-agent') return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            return null
          },
        },
      } as any

      expect(getUserAgent(request)).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
    })

    it('returns Unknown when no user agent', () => {
      const request = {
        headers: {
          get: () => null,
        },
      } as any

      expect(getUserAgent(request)).toBe('Unknown')
    })
  })

  describe('Session Security Scenarios', () => {
    it('detects idle session timeout', () => {
      // User was active 35 minutes ago
      const lastActivity = new Date(Date.now() - 35 * 60 * 1000)

      expect(isSessionTimedOut(lastActivity)).toBe(true)
    })

    it('keeps session alive with recent activity', () => {
      // User was active 5 minutes ago
      const lastActivity = new Date(Date.now() - 5 * 60 * 1000)

      expect(isSessionTimedOut(lastActivity)).toBe(false)
    })

    it('expires very old sessions', () => {
      // Session created 2 days ago
      const sessionCreated = new Date(Date.now() - 48 * 60 * 60 * 1000)

      expect(isSessionExpired(sessionCreated)).toBe(true)
    })

    it('handles admin force logout', () => {
      // Session created before admin invalidated all sessions
      const sessionCreated = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      const invalidatedAt = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago

      expect(isSessionInvalidated(sessionCreated, invalidatedAt)).toBe(true)
    })

    it('allows new sessions after force logout', () => {
      // New session created after invalidation
      const invalidatedAt = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      const sessionCreated = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago

      expect(isSessionInvalidated(sessionCreated, invalidatedAt)).toBe(false)
    })
  })
})
