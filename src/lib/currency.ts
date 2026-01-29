/**
 * UK Currency Utilities
 * Comprehensive currency formatting, conversion, and calculation utilities
 * for UK grocery store (GBP - British Pounds Sterling)
 */

import {
  UK_LOCALE,
  UK_CURRENCY_CODE,
  UK_CURRENCY_SYMBOL,
  UK_VAT_RATE,
  UK_VAT_RATE_REDUCED,
  UK_VAT_RATE_ZERO,
} from './locale'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type VATRate = 'standard' | 'reduced' | 'zero'

export interface PriceFormatOptions {
  /** Show pence as fraction (e.g., ".99" instead of full price) */
  showPenceOnly?: boolean
  /** Show the currency symbol */
  showSymbol?: boolean
  /** Show "Free" for zero prices */
  showFreeLabel?: boolean
  /** Compact format for large prices (e.g., "1.2K") */
  compact?: boolean
  /** Round to nearest pound (no pence) */
  roundToPound?: boolean
  /** Show positive sign for positive values */
  showPositiveSign?: boolean
  /** Minimum fraction digits */
  minimumFractionDigits?: number
  /** Maximum fraction digits */
  maximumFractionDigits?: number
}

export interface PriceBreakdown {
  /** Subtotal before VAT (net) */
  net: number
  /** VAT amount */
  vat: number
  /** Total including VAT (gross) */
  gross: number
  /** VAT rate applied */
  vatRate: number
}

export interface DiscountResult {
  /** Original price in pence */
  originalPrice: number
  /** Discount amount in pence */
  discountAmount: number
  /** Final price after discount in pence */
  finalPrice: number
  /** Discount percentage (0-100) */
  discountPercentage: number
  /** Savings as formatted string */
  savingsFormatted: string
}

export interface PriceRange {
  min: number
  max: number
}

export interface ExchangeRate {
  from: string
  to: string
  rate: number
  timestamp: Date
}

// =============================================================================
// CORE PRICE FORMATTING
// =============================================================================

/**
 * Format pence to GBP currency string
 * Primary formatting function for UK grocery store prices
 *
 * @param pence - Amount in pence (e.g., 399 = £3.99)
 * @param options - Formatting options
 *
 * @example
 * formatPrice(399) // "£3.99"
 * formatPrice(0, { showFreeLabel: true }) // "Free"
 * formatPrice(100000, { compact: true }) // "£1K"
 * formatPrice(350, { roundToPound: true }) // "£4"
 */
export function formatPrice(
  pence: number,
  options: PriceFormatOptions = {}
): string {
  const {
    showPenceOnly = false,
    showSymbol = true,
    showFreeLabel = false,
    compact = false,
    roundToPound = false,
    showPositiveSign = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options

  // Handle free items
  if (pence === 0 && showFreeLabel) {
    return 'Free'
  }

  // Convert pence to pounds
  let pounds = pence / 100

  // Round to nearest pound if requested
  if (roundToPound) {
    pounds = Math.round(pounds)
  }

  // Show pence only (for items under £1)
  if (showPenceOnly && Math.abs(pence) < 100) {
    return `${pence}p`
  }

  // Compact format for large amounts
  if (compact) {
    return new Intl.NumberFormat(UK_LOCALE, {
      style: 'currency',
      currency: UK_CURRENCY_CODE,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(pounds)
  }

  // Standard formatting
  const formatted = new Intl.NumberFormat(UK_LOCALE, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: UK_CURRENCY_CODE,
    minimumFractionDigits: roundToPound ? 0 : minimumFractionDigits,
    maximumFractionDigits: roundToPound ? 0 : maximumFractionDigits,
    signDisplay: showPositiveSign ? 'exceptZero' : 'auto',
  }).format(pounds)

  return formatted
}

/**
 * Format price from pounds (not pence)
 *
 * @param pounds - Amount in pounds
 *
 * @example
 * formatPriceFromPounds(3.99) // "£3.99"
 */
export function formatPriceFromPounds(
  pounds: number,
  options: PriceFormatOptions = {}
): string {
  return formatPrice(Math.round(pounds * 100), options)
}

/**
 * Parse a formatted price string back to pence
 *
 * @example
 * parsePriceToPence("£3.99") // 399
 * parsePriceToPence("3.99") // 399
 * parsePriceToPence("99p") // 99
 */
export function parsePriceToPence(priceString: string): number {
  // Handle pence format
  if (priceString.toLowerCase().endsWith('p')) {
    return parseInt(priceString.replace(/[^\d]/g, ''), 10) || 0
  }

  // Remove currency symbol and any non-numeric characters except decimal point
  const cleaned = priceString.replace(/[^0-9.-]/g, '')
  const pounds = parseFloat(cleaned)

  if (isNaN(pounds)) {
    return 0
  }

  return Math.round(pounds * 100)
}

/**
 * Format a price with strikethrough for original price
 * Returns both formatted prices for display
 *
 * @example
 * formatPriceWithSale(599, 399) // { original: "£5.99", sale: "£3.99" }
 */
export function formatPriceWithSale(
  originalPence: number,
  salePence: number
): {
  original: string
  sale: string
  savings: string
  savingsPercentage: string
} {
  const savings = originalPence - salePence
  const percentage = calculateDiscountPercentage(originalPence, salePence)

  return {
    original: formatPrice(originalPence),
    sale: formatPrice(salePence),
    savings: formatPrice(savings),
    savingsPercentage: `${Math.round(percentage)}%`,
  }
}

// =============================================================================
// PRICE RANGE FORMATTING
// =============================================================================

/**
 * Format a price range
 *
 * @example
 * formatPriceRange({ min: 199, max: 599 }) // "£1.99 - £5.99"
 * formatPriceRange({ min: 199, max: 199 }) // "£1.99"
 */
export function formatPriceRange(
  range: PriceRange,
  options: { separator?: string } = {}
): string {
  const { separator = ' - ' } = options

  if (range.min === range.max) {
    return formatPrice(range.min)
  }

  return `${formatPrice(range.min)}${separator}${formatPrice(range.max)}`
}

/**
 * Format price starting from
 *
 * @example
 * formatPriceFrom(199) // "From £1.99"
 */
export function formatPriceFrom(pence: number): string {
  return `From ${formatPrice(pence)}`
}

/**
 * Format price up to
 *
 * @example
 * formatPriceUpTo(999) // "Up to £9.99"
 */
export function formatPriceUpTo(pence: number): string {
  return `Up to ${formatPrice(pence)}`
}

/**
 * Format price per unit (e.g., per kg, per item)
 *
 * @example
 * formatPricePerUnit(350, 'kg') // "£3.50/kg"
 * formatPricePerUnit(99, 'each') // "99p each"
 */
export function formatPricePerUnit(
  pence: number,
  unit: string,
  options: { separator?: string } = {}
): string {
  const { separator = '/' } = options

  // For prices under £1, show in pence
  if (pence < 100 && unit !== 'each') {
    return `${pence}p${separator}${unit}`
  }

  if (unit === 'each') {
    return `${formatPrice(pence)} each`
  }

  return `${formatPrice(pence)}${separator}${unit}`
}

// =============================================================================
// DISCOUNT CALCULATIONS
// =============================================================================

/**
 * Calculate discount percentage between original and sale price
 *
 * @example
 * calculateDiscountPercentage(1000, 800) // 20
 */
export function calculateDiscountPercentage(
  originalPence: number,
  salePence: number
): number {
  if (originalPence <= 0) return 0
  if (salePence >= originalPence) return 0

  return ((originalPence - salePence) / originalPence) * 100
}

/**
 * Calculate the sale price from original price and discount percentage
 *
 * @example
 * calculateSalePrice(1000, 20) // 800 (20% off)
 */
export function calculateSalePrice(
  originalPence: number,
  discountPercentage: number
): number {
  if (discountPercentage <= 0) return originalPence
  if (discountPercentage >= 100) return 0

  return Math.round(originalPence * (1 - discountPercentage / 100))
}

/**
 * Calculate complete discount breakdown
 *
 * @example
 * calculateDiscount(1000, 20)
 * // {
 * //   originalPrice: 1000,
 * //   discountAmount: 200,
 * //   finalPrice: 800,
 * //   discountPercentage: 20,
 * //   savingsFormatted: "Save £2.00"
 * // }
 */
export function calculateDiscount(
  originalPence: number,
  discountPercentage: number
): DiscountResult {
  const discountAmount = Math.round(originalPence * (discountPercentage / 100))
  const finalPrice = originalPence - discountAmount

  return {
    originalPrice: originalPence,
    discountAmount,
    finalPrice,
    discountPercentage,
    savingsFormatted: `Save ${formatPrice(discountAmount)}`,
  }
}

/**
 * Calculate multi-buy discount (e.g., 3 for £5)
 *
 * @example
 * calculateMultiBuyDiscount(250, 3, 500)
 * // { unitPrice: 167, totalSavings: 250, ... }
 */
export function calculateMultiBuyDiscount(
  originalUnitPence: number,
  quantity: number,
  dealPence: number
): {
  originalTotal: number
  dealTotal: number
  unitPrice: number
  totalSavings: number
  savingsPercentage: number
  dealDescription: string
} {
  const originalTotal = originalUnitPence * quantity
  const unitPrice = Math.round(dealPence / quantity)
  const totalSavings = originalTotal - dealPence
  const savingsPercentage = calculateDiscountPercentage(originalTotal, dealPence)

  return {
    originalTotal,
    dealTotal: dealPence,
    unitPrice,
    totalSavings,
    savingsPercentage,
    dealDescription: `${quantity} for ${formatPrice(dealPence)}`,
  }
}

/**
 * Format discount percentage for display
 *
 * @example
 * formatDiscountPercentage(33.333) // "33% off"
 * formatDiscountPercentage(50, { showOff: false }) // "50%"
 */
export function formatDiscountPercentage(
  percentage: number,
  options: { showOff?: boolean; roundTo?: number } = {}
): string {
  const { showOff = true, roundTo = 0 } = options

  const rounded = roundTo > 0
    ? percentage.toFixed(roundTo)
    : Math.round(percentage).toString()

  return showOff ? `${rounded}% off` : `${rounded}%`
}

// =============================================================================
// VAT CALCULATIONS
// =============================================================================

/** VAT rates mapping */
const VAT_RATES: Record<VATRate, number> = {
  standard: UK_VAT_RATE,
  reduced: UK_VAT_RATE_REDUCED,
  zero: UK_VAT_RATE_ZERO,
}

/**
 * Calculate VAT breakdown from gross price (VAT inclusive)
 * Most UK retail prices include VAT
 *
 * @example
 * calculateVATFromGross(1200, 'standard')
 * // { net: 1000, vat: 200, gross: 1200, vatRate: 0.20 }
 */
export function calculateVATFromGross(
  grossPence: number,
  vatType: VATRate = 'standard'
): PriceBreakdown {
  const vatRate = VAT_RATES[vatType]
  const net = Math.round(grossPence / (1 + vatRate))
  const vat = grossPence - net

  return {
    net,
    vat,
    gross: grossPence,
    vatRate,
  }
}

/**
 * Calculate VAT breakdown from net price (VAT exclusive)
 *
 * @example
 * calculateVATFromNet(1000, 'standard')
 * // { net: 1000, vat: 200, gross: 1200, vatRate: 0.20 }
 */
export function calculateVATFromNet(
  netPence: number,
  vatType: VATRate = 'standard'
): PriceBreakdown {
  const vatRate = VAT_RATES[vatType]
  const vat = Math.round(netPence * vatRate)
  const gross = netPence + vat

  return {
    net: netPence,
    vat,
    gross,
    vatRate,
  }
}

/**
 * Add VAT to a net price
 *
 * @example
 * addVAT(1000) // 1200 (standard 20% VAT)
 * addVAT(1000, 'reduced') // 1050 (5% VAT)
 */
export function addVAT(
  netPence: number,
  vatType: VATRate = 'standard'
): number {
  const vatRate = VAT_RATES[vatType]
  return Math.round(netPence * (1 + vatRate))
}

/**
 * Remove VAT from a gross price
 *
 * @example
 * removeVAT(1200) // 1000
 */
export function removeVAT(
  grossPence: number,
  vatType: VATRate = 'standard'
): number {
  const vatRate = VAT_RATES[vatType]
  return Math.round(grossPence / (1 + vatRate))
}

/**
 * Calculate just the VAT amount
 *
 * @example
 * calculateVATAmount(1000, 'standard') // 200
 */
export function calculateVATAmount(
  netPence: number,
  vatType: VATRate = 'standard'
): number {
  const vatRate = VAT_RATES[vatType]
  return Math.round(netPence * vatRate)
}

/**
 * Format VAT breakdown for display
 *
 * @example
 * formatVATBreakdown(1200)
 * // { net: "£10.00", vat: "£2.00", gross: "£12.00", vatLabel: "VAT (20%)" }
 */
export function formatVATBreakdown(
  grossPence: number,
  vatType: VATRate = 'standard'
): {
  net: string
  vat: string
  gross: string
  vatLabel: string
} {
  const breakdown = calculateVATFromGross(grossPence, vatType)
  const vatPercentage = Math.round(breakdown.vatRate * 100)

  return {
    net: formatPrice(breakdown.net),
    vat: formatPrice(breakdown.vat),
    gross: formatPrice(breakdown.gross),
    vatLabel: `VAT (${vatPercentage}%)`,
  }
}

/**
 * Determine VAT rate for grocery items
 * Most food is zero-rated, but some items have standard or reduced rates
 */
export function getGroceryVATRate(
  category: string,
  isHotFood?: boolean,
  isLuxuryItem?: boolean
): VATRate {
  // Hot takeaway food and catering = standard rate
  if (isHotFood) {
    return 'standard'
  }

  // Confectionery, crisps, ice cream, soft drinks, alcoholic drinks = standard rate
  const standardRateCategories = [
    'confectionery',
    'chocolate',
    'sweets',
    'crisps',
    'snacks',
    'ice cream',
    'soft drinks',
    'alcohol',
    'wine',
    'beer',
    'spirits',
  ]

  if (standardRateCategories.some(cat =>
    category.toLowerCase().includes(cat)
  )) {
    return 'standard'
  }

  // Luxury items might have standard rate
  if (isLuxuryItem) {
    return 'standard'
  }

  // Most food is zero-rated
  return 'zero'
}

// =============================================================================
// CURRENCY CONVERSION
// =============================================================================

/** Common exchange rates (would be fetched from API in production) */
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  'GBP-EUR': 1.17,
  'GBP-USD': 1.27,
  'EUR-GBP': 0.85,
  'USD-GBP': 0.79,
}

/**
 * Convert currency (simplified - in production use real-time rates)
 *
 * @example
 * convertCurrency(1000, 'GBP', 'EUR') // ~1170 (at 1.17 rate)
 */
export function convertCurrency(
  amountPence: number,
  from: string,
  to: string,
  customRate?: number
): number {
  if (from === to) return amountPence

  const rateKey = `${from}-${to}`
  const rate = customRate ?? DEFAULT_EXCHANGE_RATES[rateKey]

  if (!rate) {
    throw new Error(`Exchange rate not available for ${from} to ${to}`)
  }

  return Math.round(amountPence * rate)
}

/**
 * Format price in multiple currencies
 *
 * @example
 * formatPriceMultiCurrency(1000)
 * // { GBP: "£10.00", EUR: "€11.70", USD: "$12.70" }
 */
export function formatPriceMultiCurrency(
  pencesGBP: number
): Record<string, string> {
  const formatters: Record<string, Intl.NumberFormat> = {
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    EUR: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }),
    USD: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD' }),
  }

  return {
    GBP: formatters.GBP.format(pencesGBP / 100),
    EUR: formatters.EUR.format(convertCurrency(pencesGBP, 'GBP', 'EUR') / 100),
    USD: formatters.USD.format(convertCurrency(pencesGBP, 'GBP', 'USD') / 100),
  }
}

// =============================================================================
// ORDER/CART CALCULATIONS
// =============================================================================

/**
 * Calculate order totals with all breakdowns
 */
export interface OrderTotals {
  /** Subtotal before discounts and delivery */
  subtotal: number
  /** Total discount amount */
  discounts: number
  /** Delivery fee */
  delivery: number
  /** Total VAT (if applicable) */
  vat: number
  /** Grand total */
  total: number
  /** Number of items */
  itemCount: number
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(
  items: Array<{ price: number; quantity: number; vatRate?: VATRate }>,
  options: {
    discountPence?: number
    discountPercentage?: number
    deliveryPence?: number
    freeDeliveryThreshold?: number
  } = {}
): OrderTotals {
  const {
    discountPence = 0,
    discountPercentage = 0,
    deliveryPence = 0,
    freeDeliveryThreshold,
  } = options

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // Calculate item count
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Calculate discounts
  let discounts = discountPence
  if (discountPercentage > 0) {
    discounts += Math.round(subtotal * (discountPercentage / 100))
  }

  // Calculate delivery (free over threshold)
  let delivery = deliveryPence
  if (freeDeliveryThreshold && subtotal >= freeDeliveryThreshold) {
    delivery = 0
  }

  // Calculate VAT (simplified - assumes mixed VAT rates)
  const vat = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity
    const vatBreakdown = calculateVATFromGross(itemTotal, item.vatRate || 'zero')
    return sum + vatBreakdown.vat
  }, 0)

  // Calculate total
  const total = subtotal - discounts + delivery

  return {
    subtotal,
    discounts,
    delivery,
    vat,
    total,
    itemCount,
  }
}

/**
 * Format order totals for display
 */
export function formatOrderTotals(totals: OrderTotals): Record<string, string> {
  return {
    subtotal: formatPrice(totals.subtotal),
    discounts: totals.discounts > 0 ? `-${formatPrice(totals.discounts)}` : formatPrice(0),
    delivery: totals.delivery === 0 ? 'Free' : formatPrice(totals.delivery),
    vat: formatPrice(totals.vat),
    total: formatPrice(totals.total),
    itemCount: `${totals.itemCount} item${totals.itemCount !== 1 ? 's' : ''}`,
  }
}

// =============================================================================
// PRICE COMPARISON UTILITIES
// =============================================================================

/**
 * Calculate price per 100g/100ml for comparison
 */
export function calculatePricePerHundred(
  pence: number,
  quantity: number,
  unit: 'g' | 'ml' | 'kg' | 'l'
): number {
  let quantityInBaseUnit = quantity

  // Convert to base unit (g or ml)
  if (unit === 'kg') {
    quantityInBaseUnit = quantity * 1000
  } else if (unit === 'l') {
    quantityInBaseUnit = quantity * 1000
  }

  // Calculate per 100 units
  return Math.round((pence / quantityInBaseUnit) * 100)
}

/**
 * Format comparison price
 *
 * @example
 * formatComparisonPrice(250, 500, 'g') // "50p/100g"
 */
export function formatComparisonPrice(
  pence: number,
  quantity: number,
  unit: 'g' | 'ml' | 'kg' | 'l'
): string {
  const per100 = calculatePricePerHundred(pence, quantity, unit)
  const comparisonUnit = unit === 'kg' || unit === 'g' ? '100g' : '100ml'

  if (per100 < 100) {
    return `${per100}p/${comparisonUnit}`
  }

  return `${formatPrice(per100)}/${comparisonUnit}`
}

/**
 * Determine best value from multiple options
 */
export function findBestValue(
  options: Array<{
    id: string
    pence: number
    quantity: number
    unit: 'g' | 'ml' | 'kg' | 'l'
  }>
): string | null {
  if (options.length === 0) return null

  let bestId = options[0].id
  let bestPricePer100 = calculatePricePerHundred(
    options[0].pence,
    options[0].quantity,
    options[0].unit
  )

  for (const option of options) {
    const pricePer100 = calculatePricePerHundred(
      option.pence,
      option.quantity,
      option.unit
    )
    if (pricePer100 < bestPricePer100) {
      bestPricePer100 = pricePer100
      bestId = option.id
    }
  }

  return bestId
}

// =============================================================================
// ROUNDING UTILITIES
// =============================================================================

/**
 * Round price to nearest 5p (common UK pricing)
 */
export function roundToNearest5p(pence: number): number {
  return Math.round(pence / 5) * 5
}

/**
 * Round price to nearest 10p
 */
export function roundToNearest10p(pence: number): number {
  return Math.round(pence / 10) * 10
}

/**
 * Round price to .99 (psychological pricing)
 */
export function roundTo99(pence: number): number {
  const pounds = Math.floor(pence / 100)
  return pounds * 100 + 99
}

/**
 * Round price to .95 (alternative psychological pricing)
 */
export function roundTo95(pence: number): number {
  const pounds = Math.floor(pence / 100)
  return pounds * 100 + 95
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate price is a valid positive number
 */
export function isValidPrice(pence: number): boolean {
  return typeof pence === 'number' && !isNaN(pence) && pence >= 0 && isFinite(pence)
}

/**
 * Clamp price to valid range
 */
export function clampPrice(pence: number, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
  return Math.max(min, Math.min(max, Math.round(pence)))
}

// =============================================================================
// EXPORTS - Re-export constants for convenience
// =============================================================================

export {
  UK_LOCALE,
  UK_CURRENCY_CODE,
  UK_CURRENCY_SYMBOL,
  UK_VAT_RATE,
  UK_VAT_RATE_REDUCED,
  UK_VAT_RATE_ZERO,
}
