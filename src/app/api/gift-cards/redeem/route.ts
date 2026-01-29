import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Redeem gift card at checkout
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { code, amount_pence, order_id } = body

    if (!code) {
      return NextResponse.json({ error: 'Gift card code is required' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')

    // Get gift card
    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (error || !giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 })
    }

    // Validate gift card
    if (giftCard.status !== 'active') {
      return NextResponse.json({ error: 'Gift card is not active' }, { status: 400 })
    }

    if (new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Gift card has expired' }, { status: 400 })
    }

    if (giftCard.current_balance_pence <= 0) {
      return NextResponse.json({ error: 'Gift card has no balance' }, { status: 400 })
    }

    // Calculate redemption amount
    const redeemAmount = Math.min(amount_pence, giftCard.current_balance_pence)
    const newBalance = giftCard.current_balance_pence - redeemAmount

    // Update gift card balance
    const { error: updateError } = await supabase
      .from('gift_cards')
      .update({
        current_balance_pence: newBalance,
        status: newBalance === 0 ? 'used' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', giftCard.id)

    if (updateError) {
      console.error('Error updating gift card:', updateError)
      return NextResponse.json({ error: 'Failed to redeem gift card' }, { status: 500 })
    }

    // Record transaction
    await supabase
      .from('gift_card_transactions')
      .insert({
        gift_card_id: giftCard.id,
        order_id: order_id || null,
        transaction_type: 'redemption',
        amount_pence: -redeemAmount,
        balance_after_pence: newBalance,
        description: order_id ? `Redeemed for order ${order_id}` : 'Redeemed at checkout'
      })

    return NextResponse.json({
      success: true,
      redeemed_amount_pence: redeemAmount,
      remaining_balance_pence: newBalance
    })
  } catch (error) {
    console.error('Redeem gift card error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
