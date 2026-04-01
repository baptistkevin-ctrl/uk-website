/**
 * Money utilities — Solaris Standard
 *
 * ALL money is stored and computed as integer pence.
 * NEVER use floats for money.
 * Display uses Intl.NumberFormat.
 */

/**
 * Format pence as GBP currency string
 * e.g., 1999 → "£19.99"
 */
export function formatPence(pence: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(pence / 100)
}

/**
 * Convert pounds to pence
 * e.g., 19.99 → 1999
 */
export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100)
}

/**
 * Convert pence to pounds
 * e.g., 1999 → 19.99
 */
export function penceToPounds(pence: number): number {
  return pence / 100
}

/**
 * Calculate tax from subtotal
 * Always round at the end, not intermediate steps
 */
export function calculateTax(subtotalPence: number, taxRate: number): number {
  return Math.round(subtotalPence * taxRate)
}

/**
 * Calculate discount
 */
export function calculateDiscount(
  subtotalPence: number,
  discountPercent: number
): number {
  return Math.round(subtotalPence * discountPercent)
}

/**
 * Calculate order total
 * subtotal + delivery + tax - discount
 */
export function calculateOrderTotal(params: {
  subtotalPence: number
  deliveryFeePence: number
  taxPence?: number
  discountPence?: number
}): number {
  return (
    params.subtotalPence +
    params.deliveryFeePence +
    (params.taxPence || 0) -
    (params.discountPence || 0)
  )
}

/**
 * Calculate commission split — platform takes calculated amount,
 * vendor gets the remainder (ensures exact sum)
 */
export function calculateCommissionSplit(
  totalPence: number,
  commissionRate: number
): { platformPence: number; vendorPence: number } {
  const platformPence = Math.round(totalPence * commissionRate)
  const vendorPence = totalPence - platformPence
  return { platformPence, vendorPence }
}
