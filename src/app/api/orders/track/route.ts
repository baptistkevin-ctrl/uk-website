import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, email } = await request.json()

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'Order number and email are required' },
        { status: 400 }
      )
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

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to look up order' },
      { status: 500 }
    )
  }
}
