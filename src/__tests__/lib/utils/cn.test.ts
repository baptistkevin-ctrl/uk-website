import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils/cn'

describe('cn (className utility)', () => {
  describe('basic functionality', () => {
    it('merges multiple class strings', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles undefined and null values', () => {
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2')
      expect(cn('class1', null, 'class2')).toBe('class1 class2')
    })

    it('handles empty strings', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2')
    })

    it('handles boolean values', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
      expect(cn('class1', true && 'class2', 'class3')).toBe('class1 class2 class3')
    })
  })

  describe('Tailwind CSS class merging', () => {
    it('merges conflicting padding classes', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
      expect(cn('px-4', 'px-2')).toBe('px-2')
      expect(cn('py-4', 'py-2')).toBe('py-2')
    })

    it('merges conflicting margin classes', () => {
      expect(cn('m-4', 'm-2')).toBe('m-2')
      expect(cn('mx-auto', 'mx-4')).toBe('mx-4')
    })

    it('merges conflicting text color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('merges conflicting background classes', () => {
      expect(cn('bg-white', 'bg-slate-100')).toBe('bg-slate-100')
    })

    it('merges conflicting flex classes', () => {
      expect(cn('flex-row', 'flex-col')).toBe('flex-col')
    })

    it('preserves non-conflicting classes', () => {
      expect(cn('p-4', 'text-red-500', 'bg-white')).toBe('p-4 text-red-500 bg-white')
    })
  })

  describe('conditional classes', () => {
    it('handles object syntax', () => {
      expect(cn({ 'class1': true, 'class2': false })).toBe('class1')
      expect(cn({ 'class1': true, 'class2': true })).toBe('class1 class2')
    })

    it('handles array syntax', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
      expect(cn(['class1', ['class2', 'class3']])).toBe('class1 class2 class3')
    })

    it('handles mixed syntax', () => {
      const isActive = true
      const isDisabled = false
      expect(cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled',
        { 'hover:bg-blue-500': true }
      )).toBe('base-class active hover:bg-blue-500')
    })
  })

  describe('real-world component patterns', () => {
    it('handles button variant classes', () => {
      const baseStyles = 'px-4 py-2 rounded font-medium'
      const variants = {
        primary: 'bg-emerald-600 text-white',
        secondary: 'bg-slate-200 text-slate-900',
        destructive: 'bg-red-600 text-white',
      }

      expect(cn(baseStyles, variants.primary)).toBe('px-4 py-2 rounded font-medium bg-emerald-600 text-white')
    })

    it('handles responsive classes', () => {
      expect(cn('text-sm', 'md:text-base', 'lg:text-lg')).toBe('text-sm md:text-base lg:text-lg')
    })

    it('handles hover and focus states', () => {
      expect(cn('bg-white', 'hover:bg-slate-100', 'focus:ring-2')).toBe('bg-white hover:bg-slate-100 focus:ring-2')
    })

    it('handles transition classes', () => {
      expect(cn('transition-all', 'duration-200', 'ease-in-out')).toBe('transition-all duration-200 ease-in-out')
    })
  })

  describe('edge cases', () => {
    it('handles no arguments', () => {
      expect(cn()).toBe('')
    })

    it('handles all falsy values', () => {
      expect(cn(null, undefined, false, '')).toBe('')
    })

    it('handles deeply nested arrays', () => {
      expect(cn(['a', ['b', ['c']]])).toBe('a b c')
    })

    it('handles numbers (not recommended but possible)', () => {
      expect(cn('class1', 0, 'class2')).toBe('class1 class2')
    })
  })
})
