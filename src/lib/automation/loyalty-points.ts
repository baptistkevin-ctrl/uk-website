// Customer Loyalty Points System
// Automatically awards and manages loyalty points for customer activities

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'

// Points configuration
const POINTS_CONFIG = {
  // Earning rates
  POINTS_PER_POUND: 1,           // 1 point per £1 spent
  SIGNUP_BONUS: 100,             // Points for new account
  REVIEW_POINTS: 25,             // Points for writing a review
  REFERRAL_POINTS: 500,          // Points for successful referral
  BIRTHDAY_BONUS: 200,           // Birthday bonus points
  FIRST_ORDER_BONUS: 50,         // Extra points on first order
  APP_INSTALL_BONUS: 100,        // Points for installing app

  // Redemption rates
  POINTS_TO_PENCE: 1,            // 1 point = 1 pence (100 points = £1)
  MIN_REDEMPTION_POINTS: 500,    // Minimum points to redeem

  // Tier thresholds (lifetime points)
  TIERS: {
    bronze: { min: 0, multiplier: 1 },
    silver: { min: 1000, multiplier: 1.25 },
    gold: { min: 5000, multiplier: 1.5 },
    platinum: { min: 15000, multiplier: 2 }
  },

  // Expiry
  POINTS_EXPIRY_DAYS: 365        // Points expire after 1 year of inactivity
}

interface PointsTransaction {
  id?: string
  user_id: string
  type: 'earn' | 'redeem' | 'expire' | 'adjust'
  action: string
  points: number
  order_id?: string | null
  reference?: string | null
  description: string
  created_at?: string
}

interface UserLoyalty {
  user_id: string
  current_points: number
  lifetime_points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tier_multiplier: number
  points_to_next_tier: number
  next_tier: string | null
}

/**
 * Get user's current tier based on lifetime points
 */
function calculateTier(lifetimePoints: number): {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  multiplier: number
  pointsToNext: number
  nextTier: string | null
} {
  const tiers = Object.entries(POINTS_CONFIG.TIERS)
    .sort((a, b) => b[1].min - a[1].min)

  for (const [tierName, config] of tiers) {
    if (lifetimePoints >= config.min) {
      // Find next tier
      const currentIndex = tiers.findIndex(t => t[0] === tierName)
      const nextTierData = currentIndex > 0 ? tiers[currentIndex - 1] : null

      return {
        tier: tierName as 'bronze' | 'silver' | 'gold' | 'platinum',
        multiplier: config.multiplier,
        pointsToNext: nextTierData ? nextTierData[1].min - lifetimePoints : 0,
        nextTier: nextTierData ? nextTierData[0] : null
      }
    }
  }

  return {
    tier: 'bronze',
    multiplier: 1,
    pointsToNext: POINTS_CONFIG.TIERS.silver.min,
    nextTier: 'silver'
  }
}

/**
 * Get user's loyalty status
 */
export async function getUserLoyalty(userId: string): Promise<UserLoyalty | null> {
  const supabase = getSupabaseAdmin()

  const { data: loyalty } = await supabase
    .from('loyalty_points')
    .select('current_points, lifetime_points')
    .eq('user_id', userId)
    .single()

  if (!loyalty) {
    // Initialize loyalty record if doesn't exist
    await supabase.from('loyalty_points').insert({
      user_id: userId,
      current_points: 0,
      lifetime_points: 0
    }) // Ignore errors

    return {
      user_id: userId,
      current_points: 0,
      lifetime_points: 0,
      tier: 'bronze',
      tier_multiplier: 1,
      points_to_next_tier: POINTS_CONFIG.TIERS.silver.min,
      next_tier: 'silver'
    }
  }

  const tierInfo = calculateTier(loyalty.lifetime_points)

  return {
    user_id: userId,
    current_points: loyalty.current_points,
    lifetime_points: loyalty.lifetime_points,
    tier: tierInfo.tier,
    tier_multiplier: tierInfo.multiplier,
    points_to_next_tier: tierInfo.pointsToNext,
    next_tier: tierInfo.nextTier
  }
}

/**
 * Award points to a user
 */
export async function awardPoints(
  userId: string,
  action: string,
  basePoints: number,
  orderId?: string,
  reference?: string,
  description?: string
): Promise<{ success: boolean; points_awarded: number; new_balance: number; error?: string }> {
  const supabase = getSupabaseAdmin()

  try {
    // Get user's current tier for multiplier
    const loyalty = await getUserLoyalty(userId)
    if (!loyalty) {
      return { success: false, points_awarded: 0, new_balance: 0, error: 'User not found' }
    }

    // Apply tier multiplier
    const pointsToAward = Math.round(basePoints * loyalty.tier_multiplier)

    // Create transaction record
    const transaction: PointsTransaction = {
      user_id: userId,
      type: 'earn',
      action,
      points: pointsToAward,
      order_id: orderId || null,
      reference: reference || null,
      description: description || `Earned ${pointsToAward} points for ${action}`
    }

    await supabase.from('points_transactions').insert(transaction)

    // Update user's points balance
    const { data: updated, error } = await supabase
      .from('loyalty_points')
      .update({
        current_points: loyalty.current_points + pointsToAward,
        lifetime_points: loyalty.lifetime_points + pointsToAward,
        last_activity_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('current_points')
      .single()

    if (error) {
      return { success: false, points_awarded: 0, new_balance: loyalty.current_points, error: error.message }
    }

    // Check for tier upgrade
    const newTierInfo = calculateTier(loyalty.lifetime_points + pointsToAward)
    if (newTierInfo.tier !== loyalty.tier) {
      await notifyTierUpgrade(userId, newTierInfo.tier)
    }

    return {
      success: true,
      points_awarded: pointsToAward,
      new_balance: updated.current_points
    }
  } catch (error) {
    return {
      success: false,
      points_awarded: 0,
      new_balance: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Award points for an order
 */
export async function awardOrderPoints(
  userId: string,
  orderId: string,
  orderTotalPence: number,
  isFirstOrder: boolean = false
): Promise<{ success: boolean; points_awarded: number }> {
  // Calculate base points (1 per pound)
  const basePoints = Math.floor(orderTotalPence / 100) * POINTS_CONFIG.POINTS_PER_POUND

  // Add first order bonus
  const bonusPoints = isFirstOrder ? POINTS_CONFIG.FIRST_ORDER_BONUS : 0
  const totalPoints = basePoints + bonusPoints

  const result = await awardPoints(
    userId,
    'purchase',
    totalPoints,
    orderId,
    undefined,
    `Points for order${isFirstOrder ? ' + first order bonus' : ''}`
  )

  return { success: result.success, points_awarded: result.points_awarded }
}

/**
 * Redeem points for discount
 */
export async function redeemPoints(
  userId: string,
  pointsToRedeem: number,
  orderId: string
): Promise<{
  success: boolean
  discount_pence: number
  remaining_points: number
  error?: string
}> {
  const supabase = getSupabaseAdmin()

  try {
    // Validate minimum redemption
    if (pointsToRedeem < POINTS_CONFIG.MIN_REDEMPTION_POINTS) {
      return {
        success: false,
        discount_pence: 0,
        remaining_points: 0,
        error: `Minimum ${POINTS_CONFIG.MIN_REDEMPTION_POINTS} points required to redeem`
      }
    }

    // Get current balance
    const loyalty = await getUserLoyalty(userId)
    if (!loyalty) {
      return { success: false, discount_pence: 0, remaining_points: 0, error: 'User not found' }
    }

    if (loyalty.current_points < pointsToRedeem) {
      return {
        success: false,
        discount_pence: 0,
        remaining_points: loyalty.current_points,
        error: `Insufficient points. You have ${loyalty.current_points} points.`
      }
    }

    // Calculate discount
    const discountPence = pointsToRedeem * POINTS_CONFIG.POINTS_TO_PENCE

    // Create redemption transaction
    const transaction: PointsTransaction = {
      user_id: userId,
      type: 'redeem',
      action: 'redemption',
      points: -pointsToRedeem,
      order_id: orderId,
      description: `Redeemed ${pointsToRedeem} points for £${(discountPence / 100).toFixed(2)} discount`
    }

    await supabase.from('points_transactions').insert(transaction)

    // Update balance
    const newBalance = loyalty.current_points - pointsToRedeem
    await supabase
      .from('loyalty_points')
      .update({
        current_points: newBalance,
        last_activity_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return {
      success: true,
      discount_pence: discountPence,
      remaining_points: newBalance
    }
  } catch (error) {
    return {
      success: false,
      discount_pence: 0,
      remaining_points: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Process expired points
 */
export async function processExpiredPoints(): Promise<{
  processed: number
  expired_users: number
  total_expired_points: number
}> {
  const supabase = getSupabaseAdmin()

  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() - POINTS_CONFIG.POINTS_EXPIRY_DAYS)

  // Find users with no activity for expiry period
  const { data: inactiveUsers } = await supabase
    .from('loyalty_points')
    .select('user_id, current_points')
    .lt('last_activity_at', expiryDate.toISOString())
    .gt('current_points', 0)

  if (!inactiveUsers || inactiveUsers.length === 0) {
    return { processed: 0, expired_users: 0, total_expired_points: 0 }
  }

  let totalExpired = 0

  for (const user of inactiveUsers) {
    // Create expiry transaction
    await supabase.from('points_transactions').insert({
      user_id: user.user_id,
      type: 'expire',
      action: 'expiry',
      points: -user.current_points,
      description: `Points expired due to ${POINTS_CONFIG.POINTS_EXPIRY_DAYS} days of inactivity`
    })

    // Zero out balance
    await supabase
      .from('loyalty_points')
      .update({ current_points: 0 })
      .eq('user_id', user.user_id)

    totalExpired += user.current_points

    // Notify user
    await notifyPointsExpiry(user.user_id, user.current_points)
  }

  return {
    processed: inactiveUsers.length,
    expired_users: inactiveUsers.length,
    total_expired_points: totalExpired
  }
}

/**
 * Award birthday bonus points
 */
export async function processBirthdayBonuses(): Promise<{
  awarded: number
  total_points: number
}> {
  const supabase = getSupabaseAdmin()

  const today = new Date()
  const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Find users with birthday today
  const { data: birthdayUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .ilike('date_of_birth', `%-${monthDay}`)

  if (!birthdayUsers || birthdayUsers.length === 0) {
    return { awarded: 0, total_points: 0 }
  }

  let totalPoints = 0
  let awarded = 0

  for (const user of birthdayUsers) {
    // Check if already awarded this year
    const year = today.getFullYear()
    const { data: existing } = await supabase
      .from('points_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('action', 'birthday_bonus')
      .gte('created_at', `${year}-01-01`)
      .single()

    if (existing) continue

    // Award birthday points
    const result = await awardPoints(
      user.id,
      'birthday_bonus',
      POINTS_CONFIG.BIRTHDAY_BONUS,
      undefined,
      undefined,
      'Happy Birthday! Enjoy your bonus points!'
    )

    if (result.success) {
      awarded++
      totalPoints += result.points_awarded

      // Send birthday email
      await sendBirthdayEmail(user.email, user.full_name, result.points_awarded)
    }
  }

  return { awarded, total_points: totalPoints }
}

/**
 * Send tier upgrade notification
 */
async function notifyTierUpgrade(userId: string, newTier: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { data: user } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (!user) return

  const tierBenefits: Record<string, string[]> = {
    silver: ['25% bonus on all points earned', 'Early access to sales', 'Free standard delivery'],
    gold: ['50% bonus on all points earned', 'Priority customer support', 'Exclusive member discounts'],
    platinum: ['100% bonus on all points earned', 'Free express delivery', 'VIP events access', 'Personal shopping assistant']
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, sans-serif; background: #f8fafc; padding: 40px 20px;">
      <table width="600" style="margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden;">
        <tr>
          <td style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 32px; text-align: center;">
            <h1 style="margin: 0; color: #fff;">🎉 Congratulations!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px;">
            <p style="font-size: 18px; color: #1e293b;">
              Hi ${user.full_name},
            </p>
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              You've been upgraded to <strong style="color: #f59e0b; text-transform: uppercase;">${newTier}</strong> status!
            </p>
            <h3 style="color: #1e293b;">Your New Benefits:</h3>
            <ul style="color: #475569; line-height: 1.8;">
              ${(tierBenefits[newTier] || []).map(b => `<li>${b}</li>`).join('')}
            </ul>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://ukgrocerystore.com/account/rewards" style="display: inline-block; background: #f59e0b; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                View Your Rewards
              </a>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await sendEmail({
    to: user.email,
    subject: `🎉 You've been upgraded to ${newTier.toUpperCase()} status!`,
    html
  })
}

/**
 * Send points expiry notification
 */
async function notifyPointsExpiry(userId: string, expiredPoints: number): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { data: user } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (!user) return

  await sendEmail({
    to: user.email,
    subject: `Your ${expiredPoints} loyalty points have expired`,
    html: `
      <p>Hi ${user.full_name},</p>
      <p>Your ${expiredPoints} loyalty points have expired due to inactivity.</p>
      <p>Shop with us to earn new points!</p>
      <a href="https://ukgrocerystore.com">Shop Now</a>
    `
  })
}

/**
 * Send birthday email with bonus points
 */
async function sendBirthdayEmail(email: string, name: string, points: number): Promise<void> {
  await sendEmail({
    to: email,
    subject: `🎂 Happy Birthday ${name}! Here's a gift from us`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, sans-serif; background: #f8fafc; padding: 40px 20px;">
        <table width="600" style="margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 32px;">🎂 Happy Birthday!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="font-size: 20px; color: #1e293b;">Hi ${name},</p>
              <p style="font-size: 18px; color: #475569;">
                Wishing you a wonderful birthday! As a gift, we've added
              </p>
              <p style="font-size: 48px; font-weight: 700; color: #ec4899; margin: 20px 0;">
                ${points} Points
              </p>
              <p style="font-size: 16px; color: #475569;">
                to your loyalty account (worth £${(points / 100).toFixed(2)})
              </p>
              <div style="margin-top: 24px;">
                <a href="https://ukgrocerystore.com" style="display: inline-block; background: #ec4899; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                  Treat Yourself Today
                </a>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })
}

/**
 * Get points transaction history
 */
export async function getPointsHistory(
  userId: string,
  limit: number = 20
): Promise<PointsTransaction[]> {
  const supabase = getSupabaseAdmin()

  const { data } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}
