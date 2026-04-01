export { cn } from './cn'
export * from './format'

// Solaris patterns
export { ok, fail, tryCatch, codeToStatus } from './result'
export type { Result, ErrorCode } from './result'
export { logger } from './logger'
export type { Logger } from './logger'
export { handleApiError, apiSuccess, apiCreated, apiCatchAll } from './api-error'
export {
  AppError, NotFoundError, UnauthorizedError, ForbiddenError,
  ConflictError, ValidationError, RateLimitError, handleAppError,
} from './errors'
export { invariant } from './invariant'
export { graceful } from './graceful'

// Re-export comprehensive locale and currency utilities
// Note: Some exports are explicitly renamed to avoid conflicts
export {
  // Constants
  UK_LOCALE,
  UK_TIMEZONE,
  UK_COUNTRY_CODE,
  UK_DIALING_CODE,
  UK_CURRENCY_CODE,
  UK_CURRENCY_SYMBOL,
  UK_VAT_RATE,
  UK_VAT_RATE_REDUCED,
  UK_VAT_RATE_ZERO,
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
  formatPricePerUnit as formatLocalePricePerUnit,
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
  // Config
  ukLocaleConfig,
} from '@/lib/locale'

export {
  // Price formatting
  formatPrice,
  formatPriceFromPounds,
  parsePriceToPence,
  formatPriceWithSale,
  formatPriceRange,
  formatPriceFrom,
  formatPriceUpTo,
  formatPricePerUnit,
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
  calculatePricePerHundred,
  // Rounding
  roundToNearest5p,
  roundToNearest10p,
  roundTo99,
  roundTo95,
  // Validation
  isValidPrice,
  clampPrice,
  // Currency conversion
  convertCurrency,
  formatPriceMultiCurrency,
} from '@/lib/currency'

// Re-export types
export type {
  WeightUnit,
  VolumeUnit,
  LengthUnit,
  DateFormatStyle,
  TimeFormatStyle,
  FormatOptions,
  DateFormatOptions,
  PhoneFormatOptions,
  UKLocaleConfig,
} from '@/lib/locale'

export type {
  VATRate,
  PriceFormatOptions,
  PriceBreakdown,
  DiscountResult,
  PriceRange,
  ExchangeRate,
  OrderTotals,
} from '@/lib/currency'
