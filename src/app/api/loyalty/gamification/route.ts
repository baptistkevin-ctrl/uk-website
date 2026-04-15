import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  BADGES,
  LOYALTY_LEVELS,
  CHARITIES,
  calculateStreak,
  getLevelForXp,
  getXpProgress,
  getBadgeProgress,
  calculateTotalXp,
  getActiveChallenges,
  type UserStats,
  type StreakData,
} from "@/lib/loyalty/gamification-engine"

export const dynamic = "force-dynamic"

// GET /api/loyalty/gamification — full gamification state for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Authentication required", details: null },
        { status: 401 }
      )
    }

    const stats = await gatherUserStats(supabase, user.id)
    const streak = await computeStreak(supabase, user.id)

    // Inject streak into stats for badge progress
    stats.currentStreak = streak.current

    const xp = calculateTotalXp(stats)
    const level = getLevelForXp(xp)
    const xpProgress = getXpProgress(xp)

    // Badge states
    const badges = BADGES.map(badge => {
      const progress = getBadgeProgress(badge, stats)
      const unlocked = progress >= badge.threshold
      return {
        badge,
        unlockedAt: unlocked ? "earned" : null,
        progress: Math.min(progress, badge.threshold),
      }
    })

    // Challenge states
    const activeChallenges = getActiveChallenges()
    const challengeProgress = await getChallengeProgress(supabase, user.id, activeChallenges)
    const challenges = activeChallenges.map(challenge => ({
      challenge,
      progress: challengeProgress[challenge.id] ?? 0,
      completed: (challengeProgress[challenge.id] ?? 0) >= challenge.target,
    }))

    // Charity preferences
    const charityInfo = await getCharityInfo(supabase, user.id)

    return NextResponse.json({
      xp,
      level,
      levels: LOYALTY_LEVELS,
      xpProgress,
      streak,
      badges,
      challenges,
      charityTotal: charityInfo.total,
      selectedCharity: charityInfo.selectedId,
      charities: CHARITIES,
      stats: {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpentPence,
        reviewCount: stats.reviewCount,
        referralCount: stats.referralCount,
        organicCount: stats.organicCount,
      },
    })
  } catch (error) {
    console.error("[loyalty/gamification] Error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to load gamification state", details: null },
      { status: 500 }
    )
  }
}

// ── Data Fetchers ──

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function gatherUserStats(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStats> {
  // Run independent queries in parallel
  const [
    ordersResult,
    reviewsResult,
    referralsResult,
    familyListResult,
    subscriptionResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_pence, created_at")
      .eq("user_id", userId)
      .in("status", ["delivered", "completed", "processing", "shipped"]),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .eq("status", "completed"),
    supabase
      .from("family_lists")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
  ])

  const orders = ordersResult.data ?? []
  const totalOrders = orders.length
  const totalSpentPence = orders.reduce(
    (sum, o) => sum + (o.total_pence ?? 0),
    0
  )

  // Count categories and products explored from order items
  const orderIds = orders.map(o => o.id)
  let categoriesExplored = 0
  let newProductsTried = 0
  let organicCount = 0

  if (orderIds.length > 0) {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, products(category_id, is_organic)")
      .in("order_id", orderIds.slice(0, 500))

    if (orderItems) {
      const categorySet = new Set<string>()
      const productSet = new Set<string>()

      for (const item of orderItems) {
        if (item.product_id) productSet.add(item.product_id)

        const product = item.products as any
        if (product?.category_id) categorySet.add(String(product.category_id))
        if (product?.is_organic) organicCount++
      }

      categoriesExplored = categorySet.size
      newProductsTried = productSet.size
    }
  }

  // Charity donations count
  let charityDonations = 0
  const { count: donationCount } = await supabase
    .from("charity_roundups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  charityDonations = donationCount ?? 0

  return {
    totalOrders,
    totalSpentPence,
    reviewCount: reviewsResult.count ?? 0,
    referralCount: referralsResult.count ?? 0,
    organicCount,
    ecoDeliveries: 0, // Requires delivery preference tracking
    categoriesExplored,
    newProductsTried,
    familyListCount: familyListResult.count ?? 0,
    recipesShared: 0, // Requires recipe share tracking
    mealPlanWeeks: 0, // Requires meal plan usage tracking
    subscriptionCount: subscriptionResult.count ?? 0,
    charityDonations,
    currentStreak: 0, // Populated by computeStreak separately
  }
}

async function computeStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakData> {
  const { data: orders } = await supabase
    .from("orders")
    .select("created_at")
    .eq("user_id", userId)
    .in("status", ["delivered", "completed", "processing", "shipped"])
    .order("created_at", { ascending: false })
    .limit(200)

  const dates = (orders ?? []).map(o => o.created_at)
  return calculateStreak(dates)
}

async function getChallengeProgress(
  supabase: SupabaseClient,
  userId: string,
  challenges: ReturnType<typeof getActiveChallenges>
): Promise<Record<string, number>> {
  const progress: Record<string, number> = {}

  const now = new Date()

  // Week boundaries (Monday to Sunday, ISO)
  const dayOfWeek = now.getUTCDay() || 7
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - dayOfWeek + 1)
  weekStart.setUTCHours(0, 0, 0, 0)

  // Month boundaries
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  for (const challenge of challenges) {
    const since = challenge.type === "weekly"
      ? weekStart.toISOString()
      : monthStart.toISOString()

    switch (challenge.id) {
      case "weekly_order": {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since)
        progress[challenge.id] = count ?? 0
        break
      }
      case "weekly_5_items": {
        const { data } = await supabase
          .from("orders")
          .select("id")
          .eq("user_id", userId)
          .gte("created_at", since)
          .limit(1)

        if (data && data.length > 0) {
          const { count } = await supabase
            .from("order_items")
            .select("id", { count: "exact", head: true })
            .eq("order_id", data[0].id)
          progress[challenge.id] = count ?? 0
        } else {
          progress[challenge.id] = 0
        }
        break
      }
      case "weekly_review": {
        const { count } = await supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since)
        progress[challenge.id] = count ?? 0
        break
      }
      case "monthly_organic": {
        const { data: monthOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("user_id", userId)
          .gte("created_at", since)

        if (monthOrders && monthOrders.length > 0) {
          const monthOrderIds = monthOrders.map(o => o.id)
          const { data: items } = await supabase
            .from("order_items")
            .select("product_id, products(is_organic)")
            .in("order_id", monthOrderIds.slice(0, 100))

          const organicItems = (items ?? []).filter(item => {
            const product = item.products as any
            return product?.is_organic
          })
          progress[challenge.id] = organicItems.length
        } else {
          progress[challenge.id] = 0
        }
        break
      }
      case "monthly_explore": {
        const { data: monthOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("user_id", userId)
          .gte("created_at", since)

        if (monthOrders && monthOrders.length > 0) {
          const monthOrderIds = monthOrders.map(o => o.id)
          const { data: items } = await supabase
            .from("order_items")
            .select("products(category_id)")
            .in("order_id", monthOrderIds.slice(0, 100))

          const categories = new Set(
            (items ?? [])
              .map(item => {
                const product = item.products as any
                return product?.category_id ? String(product.category_id) : null
              })
              .filter(Boolean)
          )
          progress[challenge.id] = categories.size
        } else {
          progress[challenge.id] = 0
        }
        break
      }
      case "monthly_meal_plan": {
        // Placeholder: requires meal_plan_usage tracking
        progress[challenge.id] = 0
        break
      }
      default: {
        // Seasonal challenges: use order count in period
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since)
        progress[challenge.id] = count ?? 0
        break
      }
    }
  }

  return progress
}

async function getCharityInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<{ total: number; selectedId: string | null }> {
  // Total donated (in pence)
  const { data: donations } = await supabase
    .from("charity_roundups")
    .select("amount_pence, charity_id")
    .eq("user_id", userId)

  const total = (donations ?? []).reduce(
    (sum, d) => sum + (d.amount_pence ?? 0),
    0
  )

  // Most recent charity selection
  const selectedId = donations && donations.length > 0
    ? donations[donations.length - 1].charity_id
    : null

  return { total, selectedId }
}
