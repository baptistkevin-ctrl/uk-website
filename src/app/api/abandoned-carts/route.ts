import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Save/update abandoned cart
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { session_id, cart_items, cart_total_pence, guest_email } = body

    if (!session_id || !cart_items || cart_items.length === 0) {
      return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 })
    }

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Check if abandoned cart already exists for this session/user
    let query = supabase
      .from('abandoned_carts')
      .select('id')

    if (user) {
      query = query.eq('user_id', user.id)
    } else {
      query = query.eq('session_id', session_id)
    }

    const { data: existing } = await query
      .eq('recovery_status', 'abandoned')
      .single()

    if (existing) {
      // Update existing abandoned cart
      const { error } = await supabase
        .from('abandoned_carts')
        .update({
          cart_items,
          cart_total_pence,
          guest_email: guest_email || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating abandoned cart:', error)
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
      }

      return NextResponse.json({ success: true, updated: true })
    } else {
      // Create new abandoned cart with cryptographic recovery token
      const { error } = await supabase
        .from('abandoned_carts')
        .insert({
          user_id: user?.id || null,
          session_id: !user ? session_id : null,
          guest_email: guest_email || null,
          cart_items,
          cart_total_pence,
          recovery_status: 'abandoned',
          recovery_token: crypto.randomBytes(32).toString('hex'),
        })

      if (error) {
        console.error('Error creating abandoned cart:', error)
        return NextResponse.json({ error: 'Failed to save cart' }, { status: 500 })
      }

      return NextResponse.json({ success: true, created: true })
    }
  } catch (error) {
    console.error('Abandoned cart error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Mark cart as recovered (called when order is placed)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { session_id, order_id } = body

    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !session_id) {
      return NextResponse.json({ error: 'Authentication or session ID required' }, { status: 400 })
    }

    let query = supabase
      .from('abandoned_carts')
      .update({
        recovery_status: 'recovered',
        recovered_order_id: order_id,
        updated_at: new Date().toISOString()
      })

    if (user) {
      query = query.eq('user_id', user.id)
    } else if (session_id) {
      query = query.eq('session_id', session_id)
    }

    await query.eq('recovery_status', 'abandoned')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark recovered error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get recovery link (for email campaigns)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const recoveryToken = searchParams.get('token')

    if (!recoveryToken) {
      return NextResponse.json({ error: 'Recovery token required' }, { status: 400 })
    }

    // Validate token format (must be 64-char hex string)
    if (!/^[a-f0-9]{64}$/.test(recoveryToken)) {
      return NextResponse.json({ error: 'Invalid recovery token' }, { status: 400 })
    }

    const { data: cart, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('recovery_token', recoveryToken)
      .eq('recovery_status', 'abandoned')
      .single()

    if (error || !cart) {
      return NextResponse.json({ error: 'Cart not found or already recovered' }, { status: 404 })
    }

    // Check if expired
    if (new Date(cart.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Recovery link has expired' }, { status: 400 })
    }

    // Mark token as used so recovery links are single-use
    await supabase
      .from('abandoned_carts')
      .update({
        recovery_status: 'recovered',
        recovered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', cart.id)

    return NextResponse.json({
      cart_items: cart.cart_items,
      cart_total_pence: cart.cart_total_pence,
      discount_code: cart.discount_code || null
    })
  } catch (error) {
    console.error('Get recovery cart error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
