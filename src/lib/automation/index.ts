// Automation Library - Exports all automation modules
// UK Grocery Store Advanced Automation System

// Abandoned Cart Recovery
export {
  processAbandonedCarts,
  markCartAsRecovered,
  createAbandonedCart
} from './abandoned-cart'

// Reorder Reminders
export {
  processReorderReminders,
  getReorderSuggestions
} from './reorder-reminders'

// Review Requests
export {
  processReviewRequests,
  getPendingReviewsForUser
} from './review-requests'

// Price Drop Alerts
export {
  trackPriceChanges,
  processPriceDropAlerts,
  createPriceAlert
} from './price-alerts'

// Expiry Date Tracking
export {
  getExpiringProducts,
  applyExpiryDiscounts,
  sendExpiryAlerts,
  removeExpiredProducts
} from './expiry-tracking'

// Fraud Detection
export {
  checkOrderFraud,
  getFraudStats
} from './fraud-detection'

// Loyalty Points
export {
  getUserLoyalty,
  awardPoints,
  awardOrderPoints,
  redeemPoints,
  processExpiredPoints,
  processBirthdayBonuses,
  getPointsHistory
} from './loyalty-points'

// Vendor Performance Scoring
export {
  calculateVendorMetrics,
  updateAllVendorScores,
  getVendorLeaderboard,
  getVendorsNeedingAttention
} from './vendor-scoring'
