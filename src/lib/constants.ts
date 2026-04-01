/**
 * Business constants for UK Grocery Store.
 *
 * All monetary values are in pence (1/100 of a pound).
 * All time values are in milliseconds unless noted.
 *
 * Change these values in one place rather than hunting through the codebase.
 */

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/** Standard delivery fee in pence (£3.99). */
export const DEFAULT_DELIVERY_FEE_PENCE = 399

/**
 * Cart subtotal in pence at which delivery becomes free (£50.00).
 * Used in cart, cart-sheet, checkout page, and checkout action.
 */
export const FREE_DELIVERY_THRESHOLD_PENCE = 5000

// ---------------------------------------------------------------------------
// Commission
// ---------------------------------------------------------------------------

/**
 * Default platform commission rate (%) applied when a vendor has no
 * custom rate set. Used in checkout action and Stripe webhook handler.
 */
export const DEFAULT_VENDOR_COMMISSION_RATE = 12.5

// ---------------------------------------------------------------------------
// Gift cards
// ---------------------------------------------------------------------------

/** Minimum gift card purchase value in pence (£5.00). */
export const GIFT_CARD_MIN_PENCE = 500

/** Maximum gift card purchase value in pence (£500.00). */
export const GIFT_CARD_MAX_PENCE = 50000

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

/** Default number of items returned by most list/paginated API routes. */
export const DEFAULT_PAGE_SIZE = 20

/** Default number of items returned by audit-log and transaction routes. */
export const ADMIN_PAGE_SIZE = 50

/** Hard upper limit on items that can be requested in a single API call. */
export const MAX_PAGE_SIZE = 200

// ---------------------------------------------------------------------------
// Polling intervals (ms)
// ---------------------------------------------------------------------------

/** How often the notification bell polls for new notifications (normal). */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000

/** Backoff polling interval used after 5 consecutive notification failures. */
export const NOTIFICATION_POLL_BACKOFF_MS = 120_000

/** How often the admin dashboard refreshes live stats. */
export const ADMIN_DASHBOARD_REFRESH_MS = 30_000

// ---------------------------------------------------------------------------
// UI feedback timeouts (ms)
// ---------------------------------------------------------------------------

/** Duration to show a "Copied!" / success toast before hiding it. */
export const COPY_FEEDBACK_TIMEOUT_MS = 2_000

/** Duration to show a longer success banner (e.g. password saved). */
export const SUCCESS_BANNER_TIMEOUT_MS = 3_000
