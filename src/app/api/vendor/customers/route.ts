import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get all vendor orders with customer info
    const { data: vendorOrders } = await supabaseAdmin
      .from('vendor_orders')
      .select(`
        vendor_amount,
        created_at,
        order:order_id(
          user_id,
          customer_name,
          customer_email,
          total_pence,
          created_at
        )
      `)
      .eq('vendor_id', vendor.id)
      .not('status', 'eq', 'cancelled')

    if (!vendorOrders || vendorOrders.length === 0) {
      return NextResponse.json({
        totalCustomers: 0,
        repeatCustomers: 0,
        repeatRate: 0,
        averageBasket: 0,
        topCustomers: [],
        recentCustomers: [],
      })
    }

    // Aggregate by customer
    const customerMap = new Map<string, {
      name: string
      email: string
      orderCount: number
      totalSpent: number
      lastOrder: string
      firstOrder: string
    }>()

    for (const vo of vendorOrders) {
      const order = vo.order as unknown as {
        user_id: string | null
        customer_name: string
        customer_email: string
        total_pence: number
        created_at: string
      } | null

      if (!order) continue

      const key = order.user_id || order.customer_email || 'guest'
      const existing = customerMap.get(key)

      if (existing) {
        existing.orderCount++
        existing.totalSpent += vo.vendor_amount || 0
        if (order.created_at > existing.lastOrder) {
          existing.lastOrder = order.created_at
        }
        if (order.created_at < existing.firstOrder) {
          existing.firstOrder = order.created_at
        }
      } else {
        customerMap.set(key, {
          name: order.customer_name || 'Guest',
          email: order.customer_email || '',
          orderCount: 1,
          totalSpent: vo.vendor_amount || 0,
          lastOrder: order.created_at,
          firstOrder: order.created_at,
        })
      }
    }

    const customers = Array.from(customerMap.values())
    const totalCustomers = customers.length
    const repeatCustomers = customers.filter(c => c.orderCount > 1).length
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
    const averageBasket = totalCustomers > 0 ? Math.round(totalRevenue / vendorOrders.length) : 0

    // Top customers by spend
    const topCustomers = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({
        name: c.name,
        email: c.email,
        orders: c.orderCount,
        totalSpent: c.totalSpent,
        lastOrder: c.lastOrder,
      }))

    // Recent new customers
    const recentCustomers = [...customers]
      .sort((a, b) => new Date(b.firstOrder).getTime() - new Date(a.firstOrder).getTime())
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        email: c.email,
        firstOrder: c.firstOrder,
        totalSpent: c.totalSpent,
      }))

    return NextResponse.json({
      totalCustomers,
      repeatCustomers,
      repeatRate,
      averageBasket,
      topCustomers,
      recentCustomers,
    })
  } catch (error) {
    console.error('Vendor customers error:', error)
    return NextResponse.json({ error: 'Failed to get customer data' }, { status: 500 })
  }
}
