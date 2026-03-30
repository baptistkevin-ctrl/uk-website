import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Temporary endpoint to replay a missed checkout.session.completed event
// DELETE THIS AFTER USE
export async function POST(request: NextRequest) {
  const { sessionId, secret } = await request.json()

  // Simple auth - must provide correct secret
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Session not paid' }, { status: 400 })
    }

    const metadata = session.metadata
    if (!metadata?.orderNumber) {
      return NextResponse.json({ error: 'No order metadata' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Check if order already exists
    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id, order_number')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ message: 'Order already exists', order: existing })
    }

    // Parse items and vendor breakdown
    const items = JSON.parse(metadata.items || '[]')
    const vendorBreakdown = JSON.parse(metadata.vendorBreakdown || '{}')
    const userId = metadata.userId && metadata.userId.length > 0 ? metadata.userId : null

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: metadata.orderNumber,
        user_id: userId,
        customer_email: session.customer_details?.email || metadata.customerEmail || '',
        customer_name: metadata.customerName || 'Customer',
        customer_phone: metadata.customerPhone || '',
        delivery_address_line_1: metadata.deliveryAddressLine1 || '',
        delivery_address_line_2: metadata.deliveryAddressLine2 || null,
        delivery_city: metadata.deliveryCity || '',
        delivery_county: metadata.deliveryCounty || null,
        delivery_postcode: metadata.deliveryPostcode || '',
        delivery_instructions: metadata.deliveryInstructions || null,
        subtotal_pence: parseInt(metadata.subtotal),
        delivery_fee_pence: parseInt(metadata.deliveryFee || '0'),
        total_pence: parseInt(metadata.total),
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: `Failed to create order: ${orderError.message}` }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      unit_price_pence: item.price,
      total_price_pence: item.price * item.quantity,
      vendor_id: item.vendorId || null,
    }))

    await supabaseAdmin.from('order_items').insert(orderItems)

    // Create vendor orders
    const vendorIds = Object.keys(vendorBreakdown).filter(id => id !== 'platform')
    for (const vendorId of vendorIds) {
      const breakdown = vendorBreakdown[vendorId]
      await supabaseAdmin.from('vendor_orders').insert({
        order_id: order.id,
        vendor_id: vendorId,
        total_amount: breakdown.amount,
        commission_amount: breakdown.commission,
        vendor_amount: breakdown.net,
        status: 'pending',
      })
    }

    return NextResponse.json({
      message: 'Order created successfully',
      order: { id: order.id, order_number: order.order_number },
    })
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      context: 'replay-order',
    })
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
