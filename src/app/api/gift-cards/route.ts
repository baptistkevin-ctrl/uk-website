import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitConfigs } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

// Get gift card by code (for checking balance)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', code.toUpperCase().replace(/[^A-Z0-9]/g, ''))
      .single()

    if (error || !giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 })
    }

    // Check if expired
    if (new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Gift card has expired' }, { status: 400 })
    }

    // Check if active
    if (giftCard.status !== 'active') {
      return NextResponse.json({ error: 'Gift card is not active' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      balance_pence: giftCard.current_balance_pence,
      expires_at: giftCard.expires_at
    })
  } catch (error) {
    console.error('Get gift card error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Purchase a gift card
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const rateLimitResult = checkRateLimit(request, rateLimitConfigs.giftCard)
  if (!rateLimitResult.success) {
    return rateLimitResult.error!
  }

  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      amount_pence,
      recipient_email,
      recipient_name,
      gift_message,
      sender_email,
      design_template
    } = body

    if (!amount_pence || amount_pence < 500) {
      return NextResponse.json(
        { error: 'Minimum gift card value is £5.00' },
        { status: 400 }
      )
    }

    if (amount_pence > 50000) {
      return NextResponse.json(
        { error: 'Maximum gift card value is £500.00' },
        { status: 400 }
      )
    }

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Generate unique code
    const { data: codeData } = await supabase.rpc('generate_gift_card_code')
    const code = codeData || generateCode()

    // Create gift card
    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .insert({
        code,
        initial_value_pence: amount_pence,
        current_balance_pence: amount_pence,
        purchased_by_user_id: user?.id || null,
        purchased_by_email: sender_email || user?.email,
        recipient_email,
        recipient_name,
        gift_message,
        design_template: design_template || 'default',
        status: 'pending' // Will be activated after payment
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating gift card:', error)
      return NextResponse.json({ error: 'Failed to create gift card' }, { status: 500 })
    }

    return NextResponse.json({
      gift_card: giftCard,
      message: 'Gift card created. Complete payment to activate.'
    })
  } catch (error) {
    console.error('Purchase gift card error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const randomBytes = new Uint8Array(16)
  crypto.getRandomValues(randomBytes)
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(randomBytes[i] % chars.length)
    if (i === 3 || i === 7 || i === 11) {
      result += '-'
    }
  }
  return result
}
