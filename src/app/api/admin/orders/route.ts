import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// GET all orders with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const paymentStatus = searchParams.get('paymentStatus')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (paymentStatus && paymentStatus !== 'all') {
    query = query.eq('payment_status', paymentStatus)
  }

  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    orders: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  })
}

// PUT - Update order status
export async function PUT(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id, status, payment_status, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updates.status = status

      // Set relevant timestamps
      const now = new Date().toISOString()
      switch (status) {
        case 'confirmed':
          updates.confirmed_at = now
          break
        case 'out_for_delivery':
          updates.dispatched_at = now
          break
        case 'delivered':
          updates.delivered_at = now
          break
        case 'cancelled':
          updates.cancelled_at = now
          break
      }
    }

    if (payment_status) {
      updates.payment_status = payment_status
      if (payment_status === 'paid') {
        updates.paid_at = new Date().toISOString()
      }
    }

    if (notes !== undefined) {
      updates.notes = notes
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
