import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimitConfigs } from '@/lib/security'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:orders:track' })

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 attempts per minute per IP
    const rateLimit = checkRateLimit(request, {
      limit: 5,
      windowMs: 60 * 1000,
      prefix: 'order-track',
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many tracking requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { orderNumber, email } = await request.json()

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'Order number and email are required' },
        { status: 400 }
      )
    }

    // Validate order number format
    if (typeof orderNumber !== 'string' || orderNumber.length > 30 || !/^ORD-[A-Z0-9-]+$/i.test(orderNumber)) {
      return NextResponse.json({ error: 'Invalid order number format' }, { status: 400 })
    }

    // Validate email format
    if (typeof email !== 'string' || email.length > 255 || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Look up order by order number and email (case insensitive)
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        customer_name,
        customer_email,
        delivery_address_line_1,
        delivery_address_line_2,
        delivery_city,
        delivery_postcode,
        subtotal_pence,
        delivery_fee_pence,
        total_pence,
        created_at,
        confirmed_at,
        shipped_at,
        delivered_at,
        order_items (
          id,
          product_name,
          product_image_url,
          quantity,
          unit_price_pence,
          total_price_pence
        )
      `)
      .eq('order_number', orderNumber)
      .ilike('customer_email', email)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found. Please check your order number and email.' },
        { status: 404 }
      )
    }

    // Redact sensitive address and financial details from tracking response
    const safeOrder = {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      delivery_city: order.delivery_city,
      delivery_postcode: order.delivery_postcode,
      created_at: order.created_at,
      confirmed_at: order.confirmed_at,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      order_items: order.order_items?.map((item: { id: string; product_name: string; product_image_url: string; quantity: number }) => ({
        id: item.id,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        quantity: item.quantity,
      })),
    }

    return NextResponse.json(safeOrder)
  } catch (error) {
    log.error('Order tracking error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to look up order' },
      { status: 500 }
    )
  }
}
