// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Gamified Loyalty 2.0 Engine
//  Streaks, Badges, Challenges, XP Levels, Charity Round-Up
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── BADGES ──

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: "shopping" | "eco" | "social" | "explorer" | "loyalty"
  requirement: string
  threshold: number
  xpReward: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

export const BADGES: Badge[] = [
  // Shopping
  { id: "first_order", name: "First Steps", description: "Place your first order", icon: "\u{1F6D2}", category: "shopping", requirement: "1 order", threshold: 1, xpReward: 50, rarity: "common" },
  { id: "regular_10", name: "Regular", description: "Place 10 orders", icon: "\u{1F504}", category: "shopping", requirement: "10 orders", threshold: 10, xpReward: 100, rarity: "common" },
  { id: "loyal_25", name: "Loyal Customer", description: "Place 25 orders", icon: "\u2B50", category: "shopping", requirement: "25 orders", threshold: 25, xpReward: 250, rarity: "rare" },
  { id: "vip_50", name: "VIP Shopper", description: "Place 50 orders", icon: "\u{1F451}", category: "shopping", requirement: "50 orders", threshold: 50, xpReward: 500, rarity: "epic" },
  { id: "legend_100", name: "Legend", description: "Place 100 orders", icon: "\u{1F3C6}", category: "shopping", requirement: "100 orders", threshold: 100, xpReward: 1000, rarity: "legendary" },
  { id: "big_spender", name: "Big Spender", description: "Spend over \u00A3500 total", icon: "\u{1F48E}", category: "shopping", requirement: "\u00A3500 spent", threshold: 50000, xpReward: 300, rarity: "rare" },
  { id: "whale", name: "Whale", description: "Spend over \u00A32000 total", icon: "\u{1F40B}", category: "shopping", requirement: "\u00A32000 spent", threshold: 200000, xpReward: 1000, rarity: "legendary" },

  // Eco
  { id: "eco_first", name: "Going Green", description: "Choose eco delivery once", icon: "\u{1F331}", category: "eco", requirement: "1 eco delivery", threshold: 1, xpReward: 50, rarity: "common" },
  { id: "eco_warrior", name: "Eco Warrior", description: "10 eco-friendly deliveries", icon: "\u{1F30D}", category: "eco", requirement: "10 eco deliveries", threshold: 10, xpReward: 200, rarity: "rare" },
  { id: "organic_lover", name: "Organic Lover", description: "Buy 20 organic products", icon: "\u{1F33F}", category: "eco", requirement: "20 organic items", threshold: 20, xpReward: 150, rarity: "rare" },
  { id: "zero_waste", name: "Zero Waste Hero", description: "Use meal planner 4 weeks", icon: "\u267B\uFE0F", category: "eco", requirement: "4 weekly plans", threshold: 4, xpReward: 200, rarity: "epic" },

  // Social
  { id: "reviewer", name: "Critic", description: "Write your first review", icon: "\u270D\uFE0F", category: "social", requirement: "1 review", threshold: 1, xpReward: 50, rarity: "common" },
  { id: "top_reviewer", name: "Top Reviewer", description: "Write 10 reviews", icon: "\u{1F4DD}", category: "social", requirement: "10 reviews", threshold: 10, xpReward: 200, rarity: "rare" },
  { id: "referrer", name: "Ambassador", description: "Refer 3 friends", icon: "\u{1F91D}", category: "social", requirement: "3 referrals", threshold: 3, xpReward: 300, rarity: "rare" },
  { id: "family_list", name: "Team Player", description: "Create a family list", icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}", category: "social", requirement: "1 family list", threshold: 1, xpReward: 75, rarity: "common" },
  { id: "recipe_shared", name: "Chef's Kiss", description: "Share 5 recipes", icon: "\u{1F468}\u200D\u{1F373}", category: "social", requirement: "5 recipes shared", threshold: 5, xpReward: 150, rarity: "rare" },

  // Explorer
  { id: "explorer_10", name: "Explorer", description: "Try 10 different categories", icon: "\u{1F9ED}", category: "explorer", requirement: "10 categories", threshold: 10, xpReward: 100, rarity: "common" },
  { id: "new_products", name: "Adventurous", description: "Try 20 new products", icon: "\u{1F195}", category: "explorer", requirement: "20 new products", threshold: 20, xpReward: 200, rarity: "rare" },
  { id: "all_categories", name: "Category Master", description: "Shop from every category", icon: "\u{1F5FA}\uFE0F", category: "explorer", requirement: "All categories", threshold: 8, xpReward: 500, rarity: "epic" },

  // Loyalty
  { id: "streak_4", name: "On a Roll", description: "4-week shopping streak", icon: "\u{1F525}", category: "loyalty", requirement: "4 week streak", threshold: 4, xpReward: 100, rarity: "common" },
  { id: "streak_12", name: "Unstoppable", description: "12-week shopping streak", icon: "\u26A1", category: "loyalty", requirement: "12 week streak", threshold: 12, xpReward: 300, rarity: "rare" },
  { id: "streak_26", name: "Half Year Hero", description: "26-week shopping streak", icon: "\u{1F31F}", category: "loyalty", requirement: "26 week streak", threshold: 26, xpReward: 750, rarity: "epic" },
  { id: "streak_52", name: "Year Champion", description: "52-week shopping streak", icon: "\u{1F4AB}", category: "loyalty", requirement: "52 week streak", threshold: 52, xpReward: 2000, rarity: "legendary" },
  { id: "subscriber", name: "Subscriber", description: "Set up Subscribe & Save", icon: "\u{1F4E6}", category: "loyalty", requirement: "1 subscription", threshold: 1, xpReward: 100, rarity: "common" },
  { id: "charity_donor", name: "Generous Heart", description: "Donate to charity 5 times", icon: "\u2764\uFE0F", category: "loyalty", requirement: "5 donations", threshold: 5, xpReward: 200, rarity: "rare" },
]

// ── CHALLENGES ──

export interface Challenge {
  id: string
  title: string
  description: string
  icon: string
  type: "weekly" | "monthly" | "seasonal"
  target: number
  xpReward: number
  pointsReward: number
  category: string
}

export function getActiveChallenges(): Challenge[] {
  const month = new Date().getMonth()

  const challenges: Challenge[] = [
    // Always-on weekly
    { id: "weekly_order", title: "Weekly Shopper", description: "Place an order this week", icon: "\u{1F6D2}", type: "weekly", target: 1, xpReward: 25, pointsReward: 50, category: "shopping" },
    { id: "weekly_5_items", title: "Basket Builder", description: "Order 5+ different items", icon: "\u{1F4E6}", type: "weekly", target: 5, xpReward: 30, pointsReward: 75, category: "shopping" },
    { id: "weekly_review", title: "Voice Your Opinion", description: "Write a product review", icon: "\u270D\uFE0F", type: "weekly", target: 1, xpReward: 20, pointsReward: 40, category: "social" },

    // Monthly
    { id: "monthly_organic", title: "Go Organic", description: "Buy 5 organic products this month", icon: "\u{1F33F}", type: "monthly", target: 5, xpReward: 100, pointsReward: 200, category: "eco" },
    { id: "monthly_explore", title: "Category Explorer", description: "Shop from 4 different categories", icon: "\u{1F9ED}", type: "monthly", target: 4, xpReward: 80, pointsReward: 150, category: "explorer" },
    { id: "monthly_meal_plan", title: "Meal Master", description: "Use the meal planner twice", icon: "\u{1F4CB}", type: "monthly", target: 2, xpReward: 75, pointsReward: 125, category: "eco" },
  ]

  // Seasonal challenges
  if (month >= 5 && month <= 7) {
    challenges.push({
      id: "summer_bbq",
      title: "BBQ Master",
      description: "Order BBQ essentials 3 times",
      icon: "\u{1F525}",
      type: "seasonal",
      target: 3,
      xpReward: 150,
      pointsReward: 300,
      category: "seasonal",
    })
  }

  if (month === 0) {
    challenges.push({
      id: "veganuary",
      title: "Veganuary Champion",
      description: "4 meat-free orders in January",
      icon: "\u{1F331}",
      type: "seasonal",
      target: 4,
      xpReward: 200,
      pointsReward: 500,
      category: "eco",
    })
  }

  return challenges
}

// ── XP LEVELS ──

export interface LoyaltyLevel {
  level: number
  name: string
  minXp: number
  maxXp: number
  perks: string[]
  color: string
}

export const LOYALTY_LEVELS: LoyaltyLevel[] = [
  { level: 1, name: "Newcomer", minXp: 0, maxXp: 200, perks: ["Earn 1 point per \u00A31"], color: "gray" },
  { level: 2, name: "Bronze", minXp: 200, maxXp: 500, perks: ["Earn 1.5 points per \u00A31", "Free delivery on \u00A330+"], color: "amber" },
  { level: 3, name: "Silver", minXp: 500, maxXp: 1200, perks: ["Earn 2 points per \u00A31", "Free delivery on \u00A325+", "Early access to deals"], color: "slate" },
  { level: 4, name: "Gold", minXp: 1200, maxXp: 3000, perks: ["Earn 2.5 points per \u00A31", "Free delivery always", "Priority customer support", "Exclusive products"], color: "yellow" },
  { level: 5, name: "Platinum", minXp: 3000, maxXp: Infinity, perks: ["Earn 3 points per \u00A31", "Free delivery always", "VIP support", "Exclusive products", "Birthday reward", "Annual gift box"], color: "purple" },
]

export function getLevelForXp(xp: number): LoyaltyLevel {
  return LOYALTY_LEVELS.findLast(l => xp >= l.minXp) ?? LOYALTY_LEVELS[0]
}

export function getXpProgress(xp: number): {
  current: number
  nextLevel: number
  percentage: number
} {
  const level = getLevelForXp(xp)
  const next = LOYALTY_LEVELS.find(l => l.minXp > level.minXp)

  if (!next) {
    return { current: xp, nextLevel: xp, percentage: 100 }
  }

  const progress = xp - level.minXp
  const needed = next.minXp - level.minXp

  return {
    current: progress,
    nextLevel: needed,
    percentage: Math.min(100, Math.round((progress / needed) * 100)),
  }
}

// ── STREAK CALCULATION ──

export interface StreakData {
  current: number
  best: number
  lastOrderDate: string | null
}

/**
 * Calculate weekly shopping streak from order dates.
 * A streak counts consecutive ISO weeks that had at least one order.
 */
export function calculateStreak(orderDates: string[]): StreakData {
  if (orderDates.length === 0) {
    return { current: 0, best: 0, lastOrderDate: null }
  }

  const sorted = [...orderDates]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime())

  const lastOrderDate = sorted[0].toISOString()

  // Convert dates to ISO week numbers
  const weekKeys = new Set(sorted.map(d => getIsoWeekKey(d)))
  const sortedWeeks = [...weekKeys].sort().reverse()

  if (sortedWeeks.length === 0) {
    return { current: 0, best: 0, lastOrderDate }
  }

  // Calculate current streak from most recent week
  const now = new Date()
  const currentWeek = getIsoWeekKey(now)
  const lastWeek = getIsoWeekKey(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))

  let currentStreak = 0
  const newestOrderWeek = sortedWeeks[0]

  // Streak is alive if the most recent order was this week or last week
  if (newestOrderWeek === currentWeek || newestOrderWeek === lastWeek) {
    currentStreak = 1
    for (let i = 1; i < sortedWeeks.length; i++) {
      const prevWeek = getPreviousWeekKey(sortedWeeks[i - 1])
      if (sortedWeeks[i] === prevWeek) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Calculate best streak ever
  let bestStreak = 1
  let tempStreak = 1
  for (let i = 1; i < sortedWeeks.length; i++) {
    const prevWeek = getPreviousWeekKey(sortedWeeks[i - 1])
    if (sortedWeeks[i] === prevWeek) {
      tempStreak++
      bestStreak = Math.max(bestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  bestStreak = Math.max(bestStreak, currentStreak)

  return { current: currentStreak, best: bestStreak, lastOrderDate }
}

function getIsoWeekKey(date: Date): string {
  const d = new Date(date.getTime())
  d.setUTCHours(0, 0, 0, 0)
  // Set to nearest Thursday (ISO week standard)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

function getPreviousWeekKey(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split("-W")
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)

  if (week > 1) {
    return `${year}-W${String(week - 1).padStart(2, "0")}`
  }

  // First week rolls back to last week of previous year
  const lastDayPrevYear = new Date(Date.UTC(year - 1, 11, 31))
  const prevYearKey = getIsoWeekKey(lastDayPrevYear)
  return prevYearKey
}

// ── BADGE PROGRESS MAPPING ──

export interface UserStats {
  totalOrders: number
  totalSpentPence: number
  reviewCount: number
  referralCount: number
  organicCount: number
  ecoDeliveries: number
  categoriesExplored: number
  newProductsTried: number
  familyListCount: number
  recipesShared: number
  mealPlanWeeks: number
  subscriptionCount: number
  charityDonations: number
  currentStreak: number
}

/**
 * Map a badge to the stat value that tracks its progress.
 */
export function getBadgeProgress(badge: Badge, stats: UserStats): number {
  const mapping: Record<string, number> = {
    first_order: stats.totalOrders,
    regular_10: stats.totalOrders,
    loyal_25: stats.totalOrders,
    vip_50: stats.totalOrders,
    legend_100: stats.totalOrders,
    big_spender: stats.totalSpentPence,
    whale: stats.totalSpentPence,
    eco_first: stats.ecoDeliveries,
    eco_warrior: stats.ecoDeliveries,
    organic_lover: stats.organicCount,
    zero_waste: stats.mealPlanWeeks,
    reviewer: stats.reviewCount,
    top_reviewer: stats.reviewCount,
    referrer: stats.referralCount,
    family_list: stats.familyListCount,
    recipe_shared: stats.recipesShared,
    explorer_10: stats.categoriesExplored,
    new_products: stats.newProductsTried,
    all_categories: stats.categoriesExplored,
    streak_4: stats.currentStreak,
    streak_12: stats.currentStreak,
    streak_26: stats.currentStreak,
    streak_52: stats.currentStreak,
    subscriber: stats.subscriptionCount,
    charity_donor: stats.charityDonations,
  }

  return mapping[badge.id] ?? 0
}

/**
 * Calculate total XP from unlocked badges.
 */
export function calculateTotalXp(stats: UserStats): number {
  let xp = 0

  for (const badge of BADGES) {
    const progress = getBadgeProgress(badge, stats)
    if (progress >= badge.threshold) {
      xp += badge.xpReward
    }
  }

  return xp
}

// ── CHARITY ROUND-UP ──

export interface Charity {
  id: string
  name: string
  description: string
  icon: string
}

export const CHARITIES: Charity[] = [
  { id: "fareshare", name: "FareShare", description: "Fighting hunger and food waste", icon: "\u{1F37D}\uFE0F" },
  { id: "trussell", name: "Trussell Trust", description: "Supporting food banks across the UK", icon: "\u{1F3E0}" },
  { id: "magic_breakfast", name: "Magic Breakfast", description: "Ensuring no child goes hungry", icon: "\u{1F305}" },
  { id: "olio", name: "OLIO", description: "Sharing surplus food with neighbours", icon: "\u{1F91D}" },
]
