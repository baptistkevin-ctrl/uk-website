// Re-export from comprehensive locale utilities
export { formatPrice } from '@/lib/currency'
export { formatUKDate as formatDate, formatUKDateTime as formatDateTime } from '@/lib/locale'

/**
 * @deprecated Use formatPrice from '@/lib/currency' instead
 * Format pence to GBP currency string
 * @param pence - Amount in pence (e.g., 399 = £3.99)
 */
export function formatPriceLegacy(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

/**
 * @deprecated Use formatUKDate from '@/lib/locale' instead
 * Format date to UK format
 */
export function formatDateLegacy(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * @deprecated Use formatUKDateTime from '@/lib/locale' instead
 * Format date with time
 */
export function formatDateTimeLegacy(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format time slot
 */
export function formatTimeSlot(start: string, end: string): string {
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`
}

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

/**
 * Slugify text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
