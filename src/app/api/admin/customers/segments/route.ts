import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const supabaseAdmin = getSupabaseAdmin()

  // Get all users with their order data
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, created_at')
    .order('created_at', { ascending: false })

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('user_id, total_pence, created_at, status')
    .eq('payment_status', 'paid')

  if (!profiles) {
    return NextResponse.json({ segments: [], customers: [] })
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)

  // Build customer data
  const customerMap = new Map<string, {
    id: string
    name: string
    email: string
    joinedAt: string
    orderCount: number
    totalSpent: number
    lastOrder: string | null
    segment: string
  }>()

  for (const profile of profiles) {
    const userOrders = (orders || []).filter(o => o.user_id === profile.id)
    const totalSpent = userOrders.reduce((sum, o) => sum + (o.total_pence || 0), 0)
    const lastOrder = userOrders.length > 0
      ? userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null

    // Segmentation logic
    let segment = 'new'
    const joinedDate = new Date(profile.created_at)
    const lastOrderDate = lastOrder ? new Date(lastOrder) : null

    if (userOrders.length === 0) {
      segment = joinedDate > sevenDaysAgo ? 'new' : 'inactive'
    } else if (totalSpent >= 50000 && userOrders.length >= 10) {
      segment = 'vip'
    } else if (userOrders.length >= 3 && lastOrderDate && lastOrderDate > thirtyDaysAgo) {
      segment = 'loyal'
    } else if (userOrders.length >= 2) {
      if (lastOrderDate && lastOrderDate > thirtyDaysAgo) {
        segment = 'returning'
      } else if (lastOrderDate && lastOrderDate < ninetyDaysAgo) {
        segment = 'churned'
      } else {
        segment = 'at_risk'
      }
    } else if (userOrders.length === 1) {
      if (lastOrderDate && lastOrderDate > thirtyDaysAgo) {
        segment = 'first_purchase'
      } else {
        segment = 'at_risk'
      }
    }

    customerMap.set(profile.id, {
      id: profile.id,
      name: profile.full_name || 'Unknown',
      email: profile.email || '',
      joinedAt: profile.created_at,
      orderCount: userOrders.length,
      totalSpent,
      lastOrder,
      segment,
    })
  }

  const customers = Array.from(customerMap.values())

  // Segment counts
  const segments = [
    { key: 'vip', label: 'VIP', description: '£500+ spent, 10+ orders', count: customers.filter(c => c.segment === 'vip').length, color: '#F59E0B' },
    { key: 'loyal', label: 'Loyal', description: '3+ orders, active in last 30 days', count: customers.filter(c => c.segment === 'loyal').length, color: '#10B981' },
    { key: 'returning', label: 'Returning', description: '2+ orders, recent activity', count: customers.filter(c => c.segment === 'returning').length, color: '#3B82F6' },
    { key: 'first_purchase', label: 'First Purchase', description: '1 order in last 30 days', count: customers.filter(c => c.segment === 'first_purchase').length, color: '#8B5CF6' },
    { key: 'new', label: 'New', description: 'Registered, no orders yet', count: customers.filter(c => c.segment === 'new').length, color: '#06B6D4' },
    { key: 'at_risk', label: 'At Risk', description: 'Ordered before, inactive 30-90 days', count: customers.filter(c => c.segment === 'at_risk').length, color: '#F97316' },
    { key: 'churned', label: 'Churned', description: 'No orders in 90+ days', count: customers.filter(c => c.segment === 'churned').length, color: '#EF4444' },
    { key: 'inactive', label: 'Inactive', description: 'Never ordered, joined 7+ days ago', count: customers.filter(c => c.segment === 'inactive').length, color: '#6B7280' },
  ]

  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgLifetimeValue = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0

  return NextResponse.json({
    segments,
    totalCustomers,
    totalRevenue,
    avgLifetimeValue,
    // Top 20 customers by spend
    topCustomers: customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 20),
  })
}
