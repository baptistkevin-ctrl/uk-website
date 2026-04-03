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

    if (!amount_pence || typeof amount_pence !== 'number' || amount_pence <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
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

    // Calculate the desired redemption amount (capped by the balance we read).
    // This is a best-effort cap; the authoritative check is in the atomic update below.
    const redeemAmount = Math.min(amount_pence, giftCard.current_balance_pence)

    // Atomic balance deduction via Supabase RPC-style raw SQL.
    // We use .rpc() to call a single UPDATE … SET current_balance_pence = current_balance_pence - $amount
    // WHERE id = $id AND current_balance_pence >= $amount, which is fully atomic.
    // Since Supabase JS .update() doesn't support SQL expressions, we use .rpc().
    const { data: updatedRows, error: updateError } = await supabase
      .rpc('redeem_gift_card_balance', {
        card_id: giftCard.id,
        redeem_amount: redeemAmount
      })

    if (updateError) {
      console.error('Error updating gift card:', updateError)
      return NextResponse.json({ error: 'Failed to redeem gift card' }, { status: 500 })
    }

    // The RPC returns the updated row(s). If empty, the WHERE … >= check failed.
    if (!updatedRows || (Array.isArray(updatedRows) && updatedRows.length === 0)) {
      return NextResponse.json({ error: 'Insufficient gift card balance. Please try again.' }, { status: 409 })
    }

    // Read the authoritative new balance from the database response
    const updatedCard = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows
    const newBalance: number = updatedCard.current_balance_pence

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
