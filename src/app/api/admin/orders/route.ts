import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { orderAudit, sanitizeSearchQuery } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET all orders with filtering
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

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
    const sanitizedSearch = sanitizeSearchQuery(search)
    if (sanitizedSearch) {
      query = query.or(`order_number.ilike.%${sanitizedSearch}%,customer_name.ilike.%${sanitizedSearch}%,customer_email.ilike.%${sanitizedSearch}%`)
    }
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
  // Verify admin authentication
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id, status, payment_status, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get current order for audit logging
    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

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

    // Log audit event
    if (auth.user && auth.profile) {
      await orderAudit.logUpdate(
        request,
        { id: auth.user.id, email: auth.user.email || '', role: auth.profile.role },
        id,
        data.order_number || id,
        currentOrder || {},
        updates
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
