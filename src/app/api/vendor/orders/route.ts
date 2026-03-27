import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'

    // Get vendor
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Build query - get vendor orders with parent order details
    let query = supabaseAdmin
      .from('vendor_orders')
      .select(`
        *,
        order:order_id(
          id,
          order_number,
          created_at,
          status,
          customer_name,
          customer_email,
          customer_phone,
          delivery_address_line_1,
          delivery_address_line_2,
          delivery_city,
          delivery_county,
          delivery_postcode,
          delivery_instructions
        )
      `)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    } else {
      // Pagination
      const pageNum = parseInt(page)
      const perPage = 20
      const from = (pageNum - 1) * perPage
      const to = from + perPage - 1
      query = query.range(from, to)
    }

    const { data: vendorOrders, error: ordersError } = await query

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      // Table may not exist yet - return empty
      if (ordersError.code === '42P01' || ordersError.message?.includes('relation') || ordersError.message?.includes('does not exist')) {
        return NextResponse.json({
          orders: [],
          total: 0,
          page: parseInt(page),
          perPage: 20
        })
      }
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Get order items for these orders
    const orderIds = vendorOrders?.map(vo => vo.order_id) || []

    let orderItems: any[] = []
    if (orderIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select(`
          *,
          product:product_id(id, name, image_url)
        `)
        .in('order_id', orderIds)
        .eq('vendor_id', vendor.id)

      orderItems = items || []
    }

    // Combine data - include both flat and nested fields for compatibility
    const orders = vendorOrders?.map(vo => ({
      id: vo.id,
      order_id: vo.order_id,
      order_number: vo.order?.order_number,
      created_at: vo.order?.created_at || vo.created_at,
      status: vo.status,
      total_amount: vo.total_amount,
      vendor_amount: vo.vendor_amount,
      commission_amount: vo.commission_amount,
      stripe_transfer_id: vo.stripe_transfer_id,
      // Flat fields for dashboard compatibility
      customer_name: vo.order?.customer_name || 'Customer',
      // Nested order object for orders page detail view
      order: {
        customer_name: vo.order?.customer_name || 'Customer',
        customer_email: vo.order?.customer_email || '',
        customer_phone: vo.order?.customer_phone || '',
        delivery_address: [
          vo.order?.delivery_address_line_1,
          vo.order?.delivery_address_line_2,
        ].filter(Boolean).join(', '),
        delivery_city: vo.order?.delivery_city || '',
        delivery_postcode: vo.order?.delivery_postcode || '',
        status: vo.order?.status || '',
      },
      items: orderItems.filter(item => item.order_id === vo.order_id)
    })) || []

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('vendor_orders')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)

    return NextResponse.json({
      orders,
      total: count || 0,
      page: parseInt(page),
      perPage: 20
    })
  } catch (error) {
    console.error('Vendor orders error:', error)
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 })
  }
}

// Update order status
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { vendor_order_id, status } = body

    if (!vendor_order_id || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 })
    }

    // Get vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Update vendor order status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('vendor_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', vendor_order_id)
      .eq('vendor_id', vendor.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
