import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatPrice,
  formatDate,
  formatDateTime,
  formatTimeSlot,
  generateOrderNumber,
  slugify,
} from '@/lib/utils/format'

describe('Format Utilities', () => {
  describe('formatPrice', () => {
    it('formats pence to GBP currency correctly', () => {
      expect(formatPrice(399)).toBe('£3.99')
      expect(formatPrice(1000)).toBe('£10.00')
      expect(formatPrice(0)).toBe('£0.00')
    })

    it('handles large amounts', () => {
      expect(formatPrice(100000)).toBe('£1,000.00')
      expect(formatPrice(9999999)).toBe('£99,999.99')
    })

    it('handles decimal precision correctly', () => {
      expect(formatPrice(1)).toBe('£0.01')
      expect(formatPrice(10)).toBe('£0.10')
      expect(formatPrice(99)).toBe('£0.99')
    })

    it('handles negative values', () => {
      expect(formatPrice(-399)).toBe('-£3.99')
    })
  })

  describe('formatDate', () => {
    it('formats Date objects to UK short format', () => {
      const date = new Date('2024-03-15')
      // Default format is short: DD/MM/YYYY
      expect(formatDate(date)).toMatch(/\d{2}\/\d{2}\/2024/)
    })

    it('formats date strings to UK format', () => {
      // Default short format returns DD/MM/YYYY
      expect(formatDate('2024-12-25')).toMatch(/25\/12\/2024/)
      expect(formatDate('2024-01-01')).toMatch(/01\/01\/2024/)
    })

    it('handles ISO date strings', () => {
      expect(formatDate('2024-06-15T10:30:00Z')).toMatch(/\d{2}\/06\/2024/)
    })
  })

  describe('formatDateTime', () => {
    it('formats Date objects with time', () => {
      const date = new Date('2024-03-15T14:30:00')
      const result = formatDateTime(date)
      // Short format with time: DD/MM/YYYY, HH:MM
      expect(result).toMatch(/\d{2}\/\d{2}\/2024/)
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('formats ISO date strings with time', () => {
      const result = formatDateTime('2024-06-20T09:15:00')
      expect(result).toMatch(/\d{2}\/06\/2024/)
    })
  })

  describe('formatTimeSlot', () => {
    it('formats time slots correctly', () => {
      expect(formatTimeSlot('09:00:00', '11:00:00')).toBe('09:00 - 11:00')
      expect(formatTimeSlot('14:30:00', '16:30:00')).toBe('14:30 - 16:30')
    })

    it('handles short time formats', () => {
      expect(formatTimeSlot('09:00', '11:00')).toBe('09:00 - 11:00')
    })

    it('handles midnight and end of day', () => {
      expect(formatTimeSlot('00:00:00', '23:59:00')).toBe('00:00 - 23:59')
    })
  })

  describe('generateOrderNumber', () => {
    it('generates order number with correct format', () => {
      const orderNumber = generateOrderNumber()
      expect(orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/)
    })

    it('generates unique order numbers', () => {
      const orders = new Set()
      for (let i = 0; i < 100; i++) {
        orders.add(generateOrderNumber())
      }
      expect(orders.size).toBe(100)
    })

    it('order number has reasonable length', () => {
      const orderNumber = generateOrderNumber()
      expect(orderNumber.length).toBeGreaterThan(10)
      expect(orderNumber.length).toBeLessThan(30)
    })
  })

  describe('slugify', () => {
    it('converts text to lowercase slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('UPPERCASE TEXT')).toBe('uppercase-text')
    })

    it('removes special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world')
      expect(slugify('Test@#$%String')).toBe('teststring')
    })

    it('handles multiple spaces and dashes', () => {
      expect(slugify('Hello   World')).toBe('hello-world')
      expect(slugify('Hello---World')).toBe('hello-world')
      expect(slugify('Hello___World')).toBe('hello-world')
    })

    it('trims leading and trailing dashes', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world')
      expect(slugify('---Hello World---')).toBe('hello-world')
    })

    it('handles empty and whitespace strings', () => {
      expect(slugify('')).toBe('')
      expect(slugify('   ')).toBe('')
    })

    it('handles product names correctly', () => {
      expect(slugify('Organic Bananas (6 Pack)')).toBe('organic-bananas-6-pack')
      expect(slugify("Ben & Jerry's Ice Cream")).toBe('ben-jerrys-ice-cream')
      expect(slugify('50% Off Sale!')).toBe('50-off-sale')
    })

    it('handles unicode characters', () => {
      expect(slugify('Café Latte')).toBe('caf-latte')
      expect(slugify('Naïve')).toBe('nave')
    })
  })
})
