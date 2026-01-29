'use client'

import { useMemo, useCallback } from 'react'

import {
  // Constants
  UK_LOCALE,
  UK_TIMEZONE,
  UK_COUNTRY_CODE,
  UK_DIALING_CODE,
  UK_CURRENCY_CODE,
  UK_CURRENCY_SYMBOL,
  UK_VAT_RATE,
  ukLocaleConfig,
  // Types
  type WeightUnit,
  type VolumeUnit,
  type DateFormatOptions,
  type PhoneFormatOptions,
  // Number formatting
  formatNumber,
  formatPercentage,
  formatOrdinal,
  formatCompactNumber,
  // Date formatting
  formatUKDate,
  formatUKTime,
  formatUKDateTime,
  formatRelativeDate,
  formatDeliveryDate,
  getDayName,
  getMonthName,
  // Measurement formatting
  formatWeight,
  formatVolume,
  formatMeasurement,
  formatPricePerUnit,
  convertWeight,
  convertVolume,
  // Phone formatting
  formatUKPhoneNumber,
  isValidUKPhoneNumber,
  parseUKPhoneNumber,
  // Postcode formatting
  formatUKPostcode,
  isValidUKPostcode,
  // List formatting
  formatList,
} from '@/lib/locale'

import {
  // Price formatting
  formatPrice,
  formatPriceFromPounds,
  parsePriceToPence,
  formatPriceWithSale,
  formatPriceRange,
  formatPriceFrom,
  formatPriceUpTo,
  formatPricePerUnit as formatCurrencyPerUnit,
  // Discount calculations
  calculateDiscountPercentage,
  calculateSalePrice,
  calculateDiscount,
  calculateMultiBuyDiscount,
  formatDiscountPercentage,
  // VAT calculations
  calculateVATFromGross,
  calculateVATFromNet,
  addVAT,
  removeVAT,
  calculateVATAmount,
  formatVATBreakdown,
  getGroceryVATRate,
  // Order calculations
  calculateOrderTotals,
  formatOrderTotals,
  // Comparison
  formatComparisonPrice,
  findBestValue,
  // Rounding
  roundToNearest5p,
  roundToNearest10p,
  roundTo99,
  roundTo95,
  // Validation
  isValidPrice,
  clampPrice,
  // Types
  type VATRate,
  type PriceFormatOptions,
  type PriceBreakdown,
  type DiscountResult,
  type PriceRange,
  type OrderTotals,
} from '@/lib/currency'

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface UseLocaleReturn {
  // Configuration
  config: typeof ukLocaleConfig
  locale: typeof UK_LOCALE
  timezone: typeof UK_TIMEZONE
  countryCode: typeof UK_COUNTRY_CODE
  dialingCode: typeof UK_DIALING_CODE
  currencyCode: typeof UK_CURRENCY_CODE
  currencySymbol: typeof UK_CURRENCY_SYMBOL
  vatRate: typeof UK_VAT_RATE

  // Number formatting
  number: {
    format: typeof formatNumber
    percentage: typeof formatPercentage
    ordinal: typeof formatOrdinal
    compact: typeof formatCompactNumber
  }

  // Date formatting
  date: {
    format: typeof formatUKDate
    time: typeof formatUKTime
    dateTime: typeof formatUKDateTime
    relative: typeof formatRelativeDate
    delivery: typeof formatDeliveryDate
    dayName: typeof getDayName
    monthName: typeof getMonthName
    /** Get current date formatted */
    now: () => string
    /** Get current time formatted */
    currentTime: () => string
    /** Check if date is today */
    isToday: (date: Date | string | number) => boolean
    /** Check if date is in the past */
    isPast: (date: Date | string | number) => boolean
    /** Check if date is in the future */
    isFuture: (date: Date | string | number) => boolean
  }

  // Currency/Price formatting
  price: {
    format: typeof formatPrice
    fromPounds: typeof formatPriceFromPounds
    parse: typeof parsePriceToPence
    withSale: typeof formatPriceWithSale
    range: typeof formatPriceRange
    from: typeof formatPriceFrom
    upTo: typeof formatPriceUpTo
    perUnit: typeof formatCurrencyPerUnit
    comparison: typeof formatComparisonPrice
    findBestValue: typeof findBestValue
    isValid: typeof isValidPrice
    clamp: typeof clampPrice
    roundTo5p: typeof roundToNearest5p
    roundTo10p: typeof roundToNearest10p
    roundTo99: typeof roundTo99
    roundTo95: typeof roundTo95
  }

  // Discount calculations
  discount: {
    percentage: typeof calculateDiscountPercentage
    salePrice: typeof calculateSalePrice
    calculate: typeof calculateDiscount
    multiBuy: typeof calculateMultiBuyDiscount
    formatPercentage: typeof formatDiscountPercentage
  }

  // VAT calculations
  vat: {
    fromGross: typeof calculateVATFromGross
    fromNet: typeof calculateVATFromNet
    add: typeof addVAT
    remove: typeof removeVAT
    amount: typeof calculateVATAmount
    formatBreakdown: typeof formatVATBreakdown
    getGroceryRate: typeof getGroceryVATRate
  }

  // Order calculations
  order: {
    calculateTotals: typeof calculateOrderTotals
    formatTotals: typeof formatOrderTotals
  }

  // Measurement formatting
  measurement: {
    weight: typeof formatWeight
    volume: typeof formatVolume
    generic: typeof formatMeasurement
    pricePerUnit: typeof formatPricePerUnit
    convertWeight: typeof convertWeight
    convertVolume: typeof convertVolume
  }

  // Phone formatting
  phone: {
    format: typeof formatUKPhoneNumber
    isValid: typeof isValidUKPhoneNumber
    parse: typeof parseUKPhoneNumber
  }

  // Postcode formatting
  postcode: {
    format: typeof formatUKPostcode
    isValid: typeof isValidUKPostcode
  }

  // List formatting
  list: {
    format: typeof formatList
  }
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * useLocale Hook
 *
 * Provides comprehensive UK locale utilities for formatting dates, currencies,
 * numbers, measurements, phone numbers, and more.
 *
 * @example
 * ```tsx
 * function ProductCard({ product }) {
 *   const { price, measurement, date } = useLocale()
 *
 *   return (
 *     <div>
 *       <h3>{product.name}</h3>
 *       <p>{price.format(product.price)}</p>
 *       <p>{measurement.weight(product.weight, 'g')}</p>
 *       <p>Best before: {date.format(product.bestBefore)}</p>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * function OrderSummary({ items }) {
 *   const { order, vat } = useLocale()
 *
 *   const totals = order.calculateTotals(items, {
 *     deliveryPence: 399,
 *     freeDeliveryThreshold: 4000,
 *   })
 *
 *   const formatted = order.formatTotals(totals)
 *
 *   return (
 *     <div>
 *       <p>Subtotal: {formatted.subtotal}</p>
 *       <p>Delivery: {formatted.delivery}</p>
 *       <p>Total: {formatted.total}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useLocale(): UseLocaleReturn {
  // Helper functions for date utilities
  const isToday = useCallback((date: Date | string | number): boolean => {
    const dateObj = date instanceof Date ? date : new Date(date)
    const today = new Date()
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    )
  }, [])

  const isPast = useCallback((date: Date | string | number): boolean => {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.getTime() < Date.now()
  }, [])

  const isFuture = useCallback((date: Date | string | number): boolean => {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.getTime() > Date.now()
  }, [])

  const now = useCallback((): string => {
    return formatUKDate(new Date())
  }, [])

  const currentTime = useCallback((): string => {
    return formatUKTime(new Date())
  }, [])

  // Memoize the return object for performance
  const localeUtils = useMemo<UseLocaleReturn>(
    () => ({
      // Configuration
      config: ukLocaleConfig,
      locale: UK_LOCALE,
      timezone: UK_TIMEZONE,
      countryCode: UK_COUNTRY_CODE,
      dialingCode: UK_DIALING_CODE,
      currencyCode: UK_CURRENCY_CODE,
      currencySymbol: UK_CURRENCY_SYMBOL,
      vatRate: UK_VAT_RATE,

      // Number formatting
      number: {
        format: formatNumber,
        percentage: formatPercentage,
        ordinal: formatOrdinal,
        compact: formatCompactNumber,
      },

      // Date formatting
      date: {
        format: formatUKDate,
        time: formatUKTime,
        dateTime: formatUKDateTime,
        relative: formatRelativeDate,
        delivery: formatDeliveryDate,
        dayName: getDayName,
        monthName: getMonthName,
        now,
        currentTime,
        isToday,
        isPast,
        isFuture,
      },

      // Price formatting
      price: {
        format: formatPrice,
        fromPounds: formatPriceFromPounds,
        parse: parsePriceToPence,
        withSale: formatPriceWithSale,
        range: formatPriceRange,
        from: formatPriceFrom,
        upTo: formatPriceUpTo,
        perUnit: formatCurrencyPerUnit,
        comparison: formatComparisonPrice,
        findBestValue: findBestValue,
        isValid: isValidPrice,
        clamp: clampPrice,
        roundTo5p: roundToNearest5p,
        roundTo10p: roundToNearest10p,
        roundTo99: roundTo99,
        roundTo95: roundTo95,
      },

      // Discount calculations
      discount: {
        percentage: calculateDiscountPercentage,
        salePrice: calculateSalePrice,
        calculate: calculateDiscount,
        multiBuy: calculateMultiBuyDiscount,
        formatPercentage: formatDiscountPercentage,
      },

      // VAT calculations
      vat: {
        fromGross: calculateVATFromGross,
        fromNet: calculateVATFromNet,
        add: addVAT,
        remove: removeVAT,
        amount: calculateVATAmount,
        formatBreakdown: formatVATBreakdown,
        getGroceryRate: getGroceryVATRate,
      },

      // Order calculations
      order: {
        calculateTotals: calculateOrderTotals,
        formatTotals: formatOrderTotals,
      },

      // Measurement formatting
      measurement: {
        weight: formatWeight,
        volume: formatVolume,
        generic: formatMeasurement,
        pricePerUnit: formatPricePerUnit,
        convertWeight: convertWeight,
        convertVolume: convertVolume,
      },

      // Phone formatting
      phone: {
        format: formatUKPhoneNumber,
        isValid: isValidUKPhoneNumber,
        parse: parseUKPhoneNumber,
      },

      // Postcode formatting
      postcode: {
        format: formatUKPostcode,
        isValid: isValidUKPostcode,
      },

      // List formatting
      list: {
        format: formatList,
      },
    }),
    [isToday, isPast, isFuture, now, currentTime]
  )

  return localeUtils
}

// =============================================================================
// ADDITIONAL SPECIALIZED HOOKS
// =============================================================================

/**
 * usePrice Hook
 *
 * Simplified hook for just price formatting
 */
export function usePrice() {
  const { price, discount, vat } = useLocale()
  return { ...price, discount, vat }
}

/**
 * useDate Hook
 *
 * Simplified hook for just date formatting
 */
export function useDate() {
  const { date } = useLocale()
  return date
}

/**
 * useMeasurement Hook
 *
 * Simplified hook for just measurement formatting
 */
export function useMeasurement() {
  const { measurement } = useLocale()
  return measurement
}

/**
 * useVAT Hook
 *
 * Simplified hook for VAT calculations
 */
export function useVAT() {
  const { vat, vatRate } = useLocale()
  return { ...vat, rate: vatRate }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  WeightUnit,
  VolumeUnit,
  DateFormatOptions,
  PhoneFormatOptions,
  VATRate,
  PriceFormatOptions,
  PriceBreakdown,
  DiscountResult,
  PriceRange,
  OrderTotals,
}
