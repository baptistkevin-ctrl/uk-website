import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

async function getVendor(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = getSupabaseAdmin()
  const { data: vendor } = await supabaseAdmin
    .from('vendors')
    .select('id, business_name')
    .eq('user_id', user.id)
    .single()

  if (!vendor) return null
  return { user, vendor }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const ctx = await getVendor(supabase)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()

    // Get gift cards created by this vendor (tracked by purchased_by_user_id)
    const { data: giftCards, error } = await supabaseAdmin
      .from('gift_cards')
      .select('*')
      .eq('purchased_by_user_id', ctx.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const cards = giftCards || []
    const stats = {
      total_cards: cards.length,
      total_value_pence: cards.reduce((sum, c) => sum + (c.initial_value_pence || 0), 0),
      total_redeemed_pence: cards.reduce((sum, c) => sum + ((c.initial_value_pence || 0) - (c.current_balance_pence || 0)), 0),
      active_cards: cards.filter(c => c.status === 'active').length,
    }

    return NextResponse.json({ giftCards: cards, stats })
  } catch (error) {
    console.error('Vendor gift cards GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await getVendor(supabase)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { value_pounds, recipient_email, recipient_name, gift_message } = body

    const valuePence = Math.round((parseFloat(value_pounds) || 0) * 100)
    if (valuePence < 100) {
      return NextResponse.json({ error: 'Minimum gift card value is £1.00' }, { status: 400 })
    }
    if (valuePence > 50000) {
      return NextResponse.json({ error: 'Maximum gift card value is £500.00' }, { status: 400 })
    }

    // Generate unique code
    const code = `GC-${nanoid(12).toUpperCase()}`

    const { data, error } = await supabaseAdmin
      .from('gift_cards')
      .insert({
        code,
        initial_value_pence: valuePence,
        current_balance_pence: valuePence,
        purchased_by_user_id: ctx.user.id,
        purchased_by_email: ctx.user.email,
        recipient_email: recipient_email || null,
        recipient_name: recipient_name || null,
        gift_message: gift_message || null,
        status: 'active',
        design_template: 'classic-green',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await getVendor(supabase)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Gift card ID is required' }, { status: 400 })
    }

    // Verify card belongs to vendor
    const { data: card } = await supabaseAdmin
      .from('gift_cards')
      .select('id')
      .eq('id', id)
      .eq('purchased_by_user_id', ctx.user.id)
      .single()

    if (!card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 })
    }

    const validStatuses = ['active', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('gift_cards')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vendor gift cards PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
