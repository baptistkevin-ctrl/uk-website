import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get user's referral code and stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create referral code
    const { data: referralCode, error: codeError } = await supabase
      .rpc('get_or_create_referral_code', { p_user_id: user.id })

    if (codeError) {
      console.error('Error getting referral code:', codeError)
      return NextResponse.json({ error: 'Failed to get referral code' }, { status: 500 })
    }

    const code = referralCode?.[0]

    // Get user's referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select(`
        id,
        status,
        referrer_reward_pence,
        referee_reward_pence,
        referrer_credited_at,
        created_at,
        referee:referee_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    // Get user's credit balance
    const { data: credits } = await supabase
      .from('user_credits')
      .select('balance_pence, lifetime_earned_pence, lifetime_spent_pence')
      .eq('user_id', user.id)
      .single()

    // Get recent credit transactions
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      referralCode: code || null,
      referrals: referrals || [],
      credits: credits || { balance_pence: 0, lifetime_earned_pence: 0, lifetime_spent_pence: 0 },
      transactions: transactions || [],
      shareUrl: code ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://ukgrocerystore.com'}/register?ref=${code.code}` : null,
    })
  } catch (error) {
    console.error('Referrals API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Apply a referral code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    // Apply the referral code
    const { data, error } = await supabase
      .rpc('apply_referral_code', {
        p_referee_id: user.id,
        p_code: code.toUpperCase()
      })

    if (error) {
      console.error('Error applying referral code:', error)
      return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 })
    }

    const result = data?.[0]

    if (!result?.success) {
      return NextResponse.json({
        success: false,
        error: result?.message || 'Invalid referral code'
      })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      referrerName: result.referrer_name,
    })
  } catch (error) {
    console.error('Referral apply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
