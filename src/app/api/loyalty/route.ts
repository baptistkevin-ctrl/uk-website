import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:loyalty' })

export const dynamic = 'force-dynamic'

// Get user's loyalty account, tiers, and redemption options
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create loyalty account
    const { data: accountData } = await supabase
      .rpc('get_or_create_loyalty_account', { p_user_id: user.id })

    // Get all tiers
    const { data: tiers } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_points', { ascending: true })

    // Get current tier details
    const { data: currentTier } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .eq('id', accountData?.tier_id)
      .single()

    // Get redemption rules
    const { data: redemptionRules } = await supabase
      .from('points_redemption_rules')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true })

    // Get earning rules
    const { data: earningRules } = await supabase
      .from('points_earning_rules')
      .select('*')
      .eq('is_active', true)

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Calculate progress to next tier
    let nextTier = null
    let pointsToNextTier = 0
    if (tiers && currentTier) {
      const currentTierIndex = tiers.findIndex(t => t.id === currentTier.id)
      if (currentTierIndex < tiers.length - 1) {
        nextTier = tiers[currentTierIndex + 1]
        pointsToNextTier = nextTier.min_points - (accountData?.lifetime_points || 0)
      }
    }

    return NextResponse.json({
      account: {
        current_points: accountData?.current_points || 0,
        lifetime_points: accountData?.lifetime_points || 0,
        points_expiring_soon: accountData?.points_expiring_soon || 0,
        next_expiry_date: accountData?.next_expiry_date,
      },
      currentTier: currentTier || tiers?.[0],
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      tiers: tiers || [],
      redemptionRules: redemptionRules || [],
      earningRules: earningRules || [],
      transactions: transactions || [],
    })
  } catch (error) {
    log.error('Loyalty API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Redeem points
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rule_id, order_id } = body

    if (!rule_id) {
      return NextResponse.json({ error: 'Redemption rule is required' }, { status: 400 })
    }

    // Redeem points
    const { data, error } = await supabase
      .rpc('redeem_loyalty_points', {
        p_user_id: user.id,
        p_rule_id: rule_id,
        p_order_id: order_id || null
      })

    if (error) {
      log.error('Error redeeming points', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 })
    }

    const result = data?.[0]

    if (!result?.success) {
      return NextResponse.json({
        success: false,
        error: result?.message || 'Failed to redeem points'
      })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      reward_type: result.reward_type,
      reward_value: result.reward_value,
    })
  } catch (error) {
    log.error('Loyalty redeem error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
