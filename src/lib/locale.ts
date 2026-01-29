/**
 * UK Locale Utilities
 * Comprehensive internationalization support for UK grocery store
 * Locale: en-GB (British English)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// =============================================================================
// LOCALE CONSTANTS
// =============================================================================

/** UK locale identifier */
export const UK_LOCALE = 'en-GB' as const

/** UK timezone */
export const UK_TIMEZONE = 'Europe/London' as const

/** UK country code */
export const UK_COUNTRY_CODE = 'GB' as const

/** UK dialing code */
export const UK_DIALING_CODE = '+44' as const

/** UK currency code */
export const UK_CURRENCY_CODE = 'GBP' as const

/** UK currency symbol */
export const UK_CURRENCY_SYMBOL = '£' as const

/** UK VAT rate (standard) */
export const UK_VAT_RATE = 0.20 as const

/** UK VAT rate for reduced items (food, children's clothing) */
export const UK_VAT_RATE_REDUCED = 0.05 as const

/** UK VAT rate zero (most food, books, children's clothing) */
export const UK_VAT_RATE_ZERO = 0 as const

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type WeightUnit = 'kg' | 'g' | 'lb' | 'oz'
export type VolumeUnit = 'l' | 'ml' | 'pt' | 'fl oz'
export type LengthUnit = 'cm' | 'm' | 'mm' | 'in' | 'ft'
export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full'
export type TimeFormatStyle = 'short' | 'medium' | 'long'

export interface FormatOptions {
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export interface DateFormatOptions {
  style?: DateFormatStyle
  includeTime?: boolean
  includeWeekday?: boolean
  relative?: boolean
}

export interface PhoneFormatOptions {
  international?: boolean
  separator?: string
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format a number according to UK locale conventions
 * Uses comma as thousands separator and period as decimal separator
 *
 * @example
 * formatNumber(1234567.89) // "1,234,567.89"
 * formatNumber(1234567.89, { maximumFractionDigits: 0 }) // "1,234,568"
 */
export function formatNumber(
  value: number,
  options: FormatOptions = {}
): string {
  const {
    locale = UK_LOCALE,
    minimumFractionDigits,
    maximumFractionDigits,
  } = options

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/**
 * Format a number as a percentage
 *
 * @example
 * formatPercentage(0.15) // "15%"
 * formatPercentage(0.156, { maximumFractionDigits: 1 }) // "15.6%"
 */
export function formatPercentage(
  value: number,
  options: FormatOptions = {}
): string {
  const {
    locale = UK_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/**
 * Format an integer with ordinal suffix
 *
 * @example
 * formatOrdinal(1) // "1st"
 * formatOrdinal(2) // "2nd"
 * formatOrdinal(23) // "23rd"
 * formatOrdinal(11) // "11th"
 */
export function formatOrdinal(n: number): string {
  const pr = new Intl.PluralRules(UK_LOCALE, { type: 'ordinal' })
  const suffixes: Record<string, string> = {
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th',
  }
  return `${n}${suffixes[pr.select(n)]}`
}

/**
 * Format a number in compact notation (K, M, B)
 *
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(UK_LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/** Date format presets for UK locale */
const DATE_FORMAT_PRESETS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
  short: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  medium: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
  long: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
  full: {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
}

/**
 * Format a date according to UK conventions (DD/MM/YYYY)
 *
 * @example
 * formatUKDate(new Date('2024-03-15')) // "15/03/2024" (short)
 * formatUKDate(new Date('2024-03-15'), { style: 'long' }) // "15 March 2024"
 * formatUKDate(new Date('2024-03-15'), { style: 'full' }) // "Friday, 15 March 2024"
 */
export function formatUKDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const { style = 'short', includeTime = false, includeWeekday = false } = options

  const dateObj = date instanceof Date ? date : new Date(date)

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    ...DATE_FORMAT_PRESETS[style],
    timeZone: UK_TIMEZONE,
  }

  if (includeWeekday && style !== 'full') {
    formatOptions.weekday = 'short'
  }

  if (includeTime) {
    formatOptions.hour = '2-digit'
    formatOptions.minute = '2-digit'
  }

  return new Intl.DateTimeFormat(UK_LOCALE, formatOptions).format(dateObj)
}

/**
 * Format time in UK format (24-hour by default)
 *
 * @example
 * formatUKTime(new Date()) // "14:30"
 * formatUKTime(new Date(), { style: 'long' }) // "14:30:45"
 */
export function formatUKTime(
  date: Date | string | number,
  options: { style?: TimeFormatStyle; hour12?: boolean } = {}
): string {
  const { style = 'short', hour12 = false } = options

  const dateObj = date instanceof Date ? date : new Date(date)

  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: UK_TIMEZONE,
  }

  if (style === 'long' || style === 'medium') {
    formatOptions.second = '2-digit'
  }

  return new Intl.DateTimeFormat(UK_LOCALE, formatOptions).format(dateObj)
}

/**
 * Format a date and time together
 *
 * @example
 * formatUKDateTime(new Date()) // "15/03/2024, 14:30"
 */
export function formatUKDateTime(
  date: Date | string | number,
  options: DateFormatOptions & { hour12?: boolean } = {}
): string {
  const { style = 'short', hour12 = false } = options

  const dateObj = date instanceof Date ? date : new Date(date)

  const formatOptions: Intl.DateTimeFormatOptions = {
    ...DATE_FORMAT_PRESETS[style],
    hour: '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: UK_TIMEZONE,
  }

  return new Intl.DateTimeFormat(UK_LOCALE, formatOptions).format(dateObj)
}

/**
 * Format a date relative to now (e.g., "2 days ago", "in 3 hours")
 *
 * @example
 * formatRelativeDate(Date.now() - 86400000) // "yesterday"
 * formatRelativeDate(Date.now() + 86400000 * 7) // "in 1 week"
 */
export function formatRelativeDate(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  const rtf = new Intl.RelativeTimeFormat(UK_LOCALE, {
    numeric: 'auto',
    style: 'long',
  })

  if (Math.abs(diffInYears) >= 1) {
    return rtf.format(diffInYears, 'year')
  }
  if (Math.abs(diffInMonths) >= 1) {
    return rtf.format(diffInMonths, 'month')
  }
  if (Math.abs(diffInWeeks) >= 1) {
    return rtf.format(diffInWeeks, 'week')
  }
  if (Math.abs(diffInDays) >= 1) {
    return rtf.format(diffInDays, 'day')
  }
  if (Math.abs(diffInHours) >= 1) {
    return rtf.format(diffInHours, 'hour')
  }
  if (Math.abs(diffInMinutes) >= 1) {
    return rtf.format(diffInMinutes, 'minute')
  }
  return rtf.format(diffInSeconds, 'second')
}

/**
 * Format a date for delivery/scheduling context
 *
 * @example
 * formatDeliveryDate(new Date('2024-03-18')) // "Monday, 18 March"
 */
export function formatDeliveryDate(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat(UK_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: UK_TIMEZONE,
  }).format(dateObj)
}

/**
 * Get the day name
 *
 * @example
 * getDayName(new Date('2024-03-15')) // "Friday"
 */
export function getDayName(
  date: Date | string | number,
  format: 'long' | 'short' | 'narrow' = 'long'
): string {
  const dateObj = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat(UK_LOCALE, {
    weekday: format,
    timeZone: UK_TIMEZONE,
  }).format(dateObj)
}

/**
 * Get the month name
 *
 * @example
 * getMonthName(new Date('2024-03-15')) // "March"
 */
export function getMonthName(
  date: Date | string | number,
  format: 'long' | 'short' | 'narrow' = 'long'
): string {
  const dateObj = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat(UK_LOCALE, {
    month: format,
    timeZone: UK_TIMEZONE,
  }).format(dateObj)
}

// =============================================================================
// WEIGHT AND MEASUREMENT FORMATTING
// =============================================================================

/**
 * Format weight with appropriate unit
 * Automatically converts between g and kg based on value
 *
 * @example
 * formatWeight(500, 'g') // "500g"
 * formatWeight(1500, 'g') // "1.5kg" (auto-convert)
 * formatWeight(1.5, 'kg') // "1.5kg"
 * formatWeight(0.5, 'kg', { autoConvert: true }) // "500g"
 */
export function formatWeight(
  value: number,
  unit: WeightUnit = 'g',
  options: { autoConvert?: boolean; precision?: number } = {}
): string {
  const { autoConvert = true, precision = 1 } = options

  let displayValue = value
  let displayUnit = unit

  if (autoConvert) {
    if (unit === 'g' && value >= 1000) {
      displayValue = value / 1000
      displayUnit = 'kg'
    } else if (unit === 'kg' && value < 1) {
      displayValue = value * 1000
      displayUnit = 'g'
    }
  }

  // Round to precision for display
  const formatted = displayValue % 1 === 0
    ? displayValue.toString()
    : displayValue.toFixed(precision).replace(/\.?0+$/, '')

  return `${formatted}${displayUnit}`
}

/**
 * Format volume with appropriate unit
 *
 * @example
 * formatVolume(500, 'ml') // "500ml"
 * formatVolume(1500, 'ml') // "1.5L" (auto-convert)
 * formatVolume(2, 'l') // "2L"
 */
export function formatVolume(
  value: number,
  unit: VolumeUnit = 'ml',
  options: { autoConvert?: boolean; precision?: number } = {}
): string {
  const { autoConvert = true, precision = 1 } = options

  let displayValue = value
  let displayUnit = unit

  if (autoConvert) {
    if (unit === 'ml' && value >= 1000) {
      displayValue = value / 1000
      displayUnit = 'l'
    } else if (unit === 'l' && value < 1) {
      displayValue = value * 1000
      displayUnit = 'ml'
    }
  }

  // Display unit in uppercase for litres
  const unitDisplay = displayUnit === 'l' ? 'L' : displayUnit

  const formatted = displayValue % 1 === 0
    ? displayValue.toString()
    : displayValue.toFixed(precision).replace(/\.?0+$/, '')

  return `${formatted}${unitDisplay}`
}

/**
 * Format a measurement with unit (generic)
 *
 * @example
 * formatMeasurement(25, 'cm') // "25cm"
 * formatMeasurement(1.5, 'm') // "1.5m"
 */
export function formatMeasurement(
  value: number,
  unit: string,
  precision: number = 2
): string {
  const formatted = value % 1 === 0
    ? value.toString()
    : value.toFixed(precision).replace(/\.?0+$/, '')

  return `${formatted}${unit}`
}

/**
 * Format price per unit (e.g., per kg, per 100g)
 *
 * @example
 * formatPricePerUnit(350, 'kg') // "£3.50/kg"
 * formatPricePerUnit(45, '100g') // "45p/100g"
 */
export function formatPricePerUnit(pence: number, unit: string): string {
  if (pence >= 100) {
    const pounds = pence / 100
    return `£${pounds.toFixed(2)}/${unit}`
  }
  return `${pence}p/${unit}`
}

/**
 * Convert between weight units
 */
export function convertWeight(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
): number {
  // Convert to grams first
  const grams: Record<WeightUnit, number> = {
    g: 1,
    kg: 1000,
    lb: 453.592,
    oz: 28.3495,
  }

  const valueInGrams = value * grams[fromUnit]
  return valueInGrams / grams[toUnit]
}

/**
 * Convert between volume units
 */
export function convertVolume(
  value: number,
  fromUnit: VolumeUnit,
  toUnit: VolumeUnit
): number {
  // Convert to ml first
  const ml: Record<VolumeUnit, number> = {
    ml: 1,
    l: 1000,
    pt: 568.261, // UK pint
    'fl oz': 28.4131, // UK fluid ounce
  }

  const valueInMl = value * ml[fromUnit]
  return valueInMl / ml[toUnit]
}

// =============================================================================
// PHONE NUMBER FORMATTING
// =============================================================================

/**
 * Format UK phone number
 *
 * @example
 * formatUKPhoneNumber('07123456789') // "07123 456789"
 * formatUKPhoneNumber('02012345678') // "020 1234 5678"
 * formatUKPhoneNumber('07123456789', { international: true }) // "+44 7123 456789"
 */
export function formatUKPhoneNumber(
  phone: string,
  options: PhoneFormatOptions = {}
): string {
  const { international = false, separator = ' ' } = options

  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')

  // Handle international format with +44
  if (cleaned.startsWith('44')) {
    cleaned = '0' + cleaned.slice(2)
  }

  // Remove leading zero for international format
  if (international && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }

  let formatted: string

  // Mobile numbers (07xxx)
  if (cleaned.startsWith('07') || (international && cleaned.startsWith('7'))) {
    if (international) {
      formatted = `+44${separator}${cleaned.slice(0, 4)}${separator}${cleaned.slice(4)}`
    } else {
      formatted = `${cleaned.slice(0, 5)}${separator}${cleaned.slice(5)}`
    }
  }
  // London numbers (020)
  else if (cleaned.startsWith('020') || (international && cleaned.startsWith('20'))) {
    if (international) {
      formatted = `+44${separator}20${separator}${cleaned.slice(2, 6)}${separator}${cleaned.slice(6)}`
    } else {
      formatted = `020${separator}${cleaned.slice(3, 7)}${separator}${cleaned.slice(7)}`
    }
  }
  // Other geographic numbers
  else {
    if (international) {
      const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned
      formatted = `+44${separator}${withoutLeadingZero.slice(0, 4)}${separator}${withoutLeadingZero.slice(4)}`
    } else {
      formatted = `${cleaned.slice(0, 5)}${separator}${cleaned.slice(5)}`
    }
  }

  return formatted
}

/**
 * Validate UK phone number
 */
export function isValidUKPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')

  // Check for valid UK number patterns
  const patterns = [
    /^0[1-9]\d{9}$/, // Standard 11-digit UK number
    /^44[1-9]\d{9}$/, // International format without +
    /^7\d{9}$/, // Mobile without leading 0
  ]

  return patterns.some(pattern => pattern.test(cleaned))
}

/**
 * Parse phone number and extract components
 */
export function parseUKPhoneNumber(phone: string): {
  isValid: boolean
  countryCode: string
  areaCode: string
  localNumber: string
  type: 'mobile' | 'geographic' | 'unknown'
} {
  const cleaned = phone.replace(/\D/g, '')

  let normalized = cleaned
  if (normalized.startsWith('44')) {
    normalized = '0' + normalized.slice(2)
  }

  const isValid = isValidUKPhoneNumber(normalized)

  let type: 'mobile' | 'geographic' | 'unknown' = 'unknown'
  let areaCode = ''
  let localNumber = ''

  if (normalized.startsWith('07')) {
    type = 'mobile'
    areaCode = normalized.slice(0, 5)
    localNumber = normalized.slice(5)
  } else if (normalized.startsWith('01') || normalized.startsWith('02')) {
    type = 'geographic'
    // London has 3-digit area code, others have 4 or 5
    if (normalized.startsWith('020')) {
      areaCode = '020'
      localNumber = normalized.slice(3)
    } else {
      areaCode = normalized.slice(0, 5)
      localNumber = normalized.slice(5)
    }
  }

  return {
    isValid,
    countryCode: '+44',
    areaCode,
    localNumber,
    type,
  }
}

// =============================================================================
// POSTCODE FORMATTING
// =============================================================================

/**
 * Format UK postcode
 *
 * @example
 * formatUKPostcode('sw1a1aa') // "SW1A 1AA"
 * formatUKPostcode('EC1A1BB') // "EC1A 1BB"
 */
export function formatUKPostcode(postcode: string): string {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase()

  // UK postcodes have inward code of 3 characters
  if (cleaned.length >= 5) {
    const outward = cleaned.slice(0, -3)
    const inward = cleaned.slice(-3)
    return `${outward} ${inward}`
  }

  return cleaned
}

/**
 * Validate UK postcode
 */
export function isValidUKPostcode(postcode: string): boolean {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase()

  // UK postcode regex pattern
  const pattern = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/
  return pattern.test(cleaned)
}

// =============================================================================
// LIST FORMATTING
// =============================================================================

/**
 * Format a list of items with proper English grammar
 *
 * @example
 * formatList(['apples', 'oranges', 'bananas']) // "apples, oranges and bananas"
 * formatList(['apples', 'oranges']) // "apples and oranges"
 * formatList(['apples']) // "apples"
 */
export function formatList(
  items: string[],
  options: { type?: 'conjunction' | 'disjunction'; style?: 'long' | 'short' | 'narrow' } = {}
): string {
  const { type = 'conjunction', style = 'long' } = options

  if (items.length === 0) return ''
  if (items.length === 1) return items[0]

  // Use type assertion for ListFormat (ES2021 feature)
  const ListFormat = (Intl as any).ListFormat
  if (ListFormat) {
    return new ListFormat(UK_LOCALE, { style, type }).format(items)
  }

  // Fallback for older environments
  if (type === 'disjunction') {
    return items.slice(0, -1).join(', ') + ' or ' + items[items.length - 1]
  }
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1]
}

// =============================================================================
// LOCALE CONFIGURATION OBJECT
// =============================================================================

/** Complete UK locale configuration object */
export const ukLocaleConfig = {
  locale: UK_LOCALE,
  timezone: UK_TIMEZONE,
  countryCode: UK_COUNTRY_CODE,
  dialingCode: UK_DIALING_CODE,
  currency: {
    code: UK_CURRENCY_CODE,
    symbol: UK_CURRENCY_SYMBOL,
  },
  vat: {
    standard: UK_VAT_RATE,
    reduced: UK_VAT_RATE_REDUCED,
    zero: UK_VAT_RATE_ZERO,
  },
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  weekStartsOn: 1 as const, // Monday
  units: {
    weight: 'kg' as WeightUnit,
    volume: 'l' as VolumeUnit,
    length: 'cm' as LengthUnit,
  },
} as const

export type UKLocaleConfig = typeof ukLocaleConfig
