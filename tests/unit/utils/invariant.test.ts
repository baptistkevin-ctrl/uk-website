/**
 * Invariant Tests — Solaris Testing Standard
 */

import { describe, it, expect } from 'vitest'
import { invariant } from '@/lib/utils/invariant'

describe('invariant', () => {
  it('should not throw when condition is truthy', () => {
    expect(() => invariant(true, 'should pass')).not.toThrow()
    expect(() => invariant(1, 'should pass')).not.toThrow()
    expect(() => invariant('hello', 'should pass')).not.toThrow()
    expect(() => invariant({}, 'should pass')).not.toThrow()
  })

  it('should throw when condition is falsy', () => {
    expect(() => invariant(false, 'failed')).toThrow('Invariant violation: failed')
    expect(() => invariant(null, 'null check')).toThrow('Invariant violation: null check')
    expect(() => invariant(undefined, 'undef')).toThrow('Invariant violation: undef')
    expect(() => invariant(0, 'zero')).toThrow('Invariant violation: zero')
    expect(() => invariant('', 'empty')).toThrow('Invariant violation: empty')
  })

  it('should narrow TypeScript type after assertion', () => {
    const value: string | null = 'hello'
    invariant(value, 'value must exist')
    // After invariant, TypeScript knows value is string (not null)
    expect(value.toUpperCase()).toBe('HELLO')
  })
})
