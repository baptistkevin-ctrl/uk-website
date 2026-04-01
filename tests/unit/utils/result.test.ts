/**
 * Result Pattern Tests — Solaris Testing Standard
 */

import { describe, it, expect } from 'vitest'
import { ok, fail, codeToStatus, tryCatch } from '@/lib/utils/result'

describe('Result Pattern', () => {
  describe('ok', () => {
    it('should create a success result', () => {
      const result = ok({ id: '123', name: 'Test' })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.id).toBe('123')
      }
    })

    it('should work with primitive values', () => {
      expect(ok(42).data).toBe(42)
      expect(ok('hello').data).toBe('hello')
      expect(ok(true).data).toBe(true)
    })
  })

  describe('fail', () => {
    it('should create a failure result with default code', () => {
      const result = fail('Something went wrong')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Something went wrong')
        expect(result.code).toBe('INTERNAL_ERROR')
      }
    })

    it('should create a failure with specific code', () => {
      const result = fail('Not found', 'NOT_FOUND')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('codeToStatus', () => {
    it('should map error codes to HTTP status codes', () => {
      expect(codeToStatus('BAD_REQUEST')).toBe(400)
      expect(codeToStatus('UNAUTHORIZED')).toBe(401)
      expect(codeToStatus('FORBIDDEN')).toBe(403)
      expect(codeToStatus('NOT_FOUND')).toBe(404)
      expect(codeToStatus('CONFLICT')).toBe(409)
      expect(codeToStatus('VALIDATION_ERROR')).toBe(422)
      expect(codeToStatus('RATE_LIMITED')).toBe(429)
      expect(codeToStatus('INTERNAL_ERROR')).toBe(500)
    })
  })

  describe('tryCatch', () => {
    it('should return ok when function succeeds', async () => {
      const result = await tryCatch(
        async () => ({ value: 42 }),
        'Failed'
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.value).toBe(42)
      }
    })

    it('should return fail when function throws', async () => {
      const result = await tryCatch(
        async () => { throw new Error('boom') },
        'Operation failed'
      )

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Operation failed')
      }
    })
  })
})
