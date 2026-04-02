import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchQuery } from '@/lib/security'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:transactions' })

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const offset = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, total_pence, subtotal_pence, delivery_fee_pence, discount_pence, payment_status, stripe_payment_intent_id, stripe_checkout_session_id, paid_at, created_at, status', { count: 'exact' })

    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus)
    }

    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search)
      if (sanitizedSearch) {
        query = query.or(`order_number.ilike.%${sanitizedSearch}%,customer_name.ilike.%${sanitizedSearch}%,customer_email.ilike.%${sanitizedSearch}%,stripe_payment_intent_id.ilike.%${sanitizedSearch}%`)
      }
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59.999Z')
    }

    const { data: transactions, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      log.error('Transactions fetch error', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Calculate summary stats
    let statsQuery = supabase
      .from('orders')
      .select('total_pence, payment_status')

    if (dateFrom) statsQuery = statsQuery.gte('created_at', dateFrom)
    if (dateTo) statsQuery = statsQuery.lte('created_at', dateTo + 'T23:59:59.999Z')

    const { data: allOrders } = await statsQuery

    const stats = {
      totalRevenue: 0,
      paidCount: 0,
      pendingCount: 0,
      failedCount: 0,
      refundedCount: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      refundedRevenue: 0,
    }

    if (allOrders) {
      for (const order of allOrders) {
        stats.totalRevenue += order.total_pence
        switch (order.payment_status) {
          case 'paid':
            stats.paidCount++
            stats.paidRevenue += order.total_pence
            break
          case 'pending':
            stats.pendingCount++
            stats.pendingRevenue += order.total_pence
            break
          case 'failed':
            stats.failedCount++
            break
          case 'refunded':
          case 'partially_refunded':
            stats.refundedCount++
            stats.refundedRevenue += order.total_pence
            break
        }
      }
    }

    return NextResponse.json({
      transactions: transactions || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      page,
      stats,
    })
  } catch (error) {
    log.error('Transactions error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
