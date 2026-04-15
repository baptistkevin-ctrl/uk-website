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

    // Get vendor
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get product stats
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)

    const { count: activeProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)

    // Get order stats from vendor_orders
    const { data: orderStats } = await supabaseAdmin
      .from('vendor_orders')
      .select('status, vendor_amount')
      .eq('vendor_id', vendor.id)

    const totalOrders = orderStats?.length || 0
    const pendingOrders = orderStats?.filter(o => o.status === 'pending').length || 0
    const totalRevenue = orderStats?.reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0

    // Get pending payout (orders that are delivered but not yet paid)
    const pendingPayout = orderStats
      ?.filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0

    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const { data: todayOrders } = await supabaseAdmin
      .from('vendor_orders')
      .select('vendor_amount, created_at')
      .eq('vendor_id', vendor.id)
      .gte('created_at', todayISO)

    const todayOrderCount = todayOrders?.length || 0
    const todayRevenue = todayOrders?.reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0

    // This week's stats (for comparison)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoISO = weekAgo.toISOString()

    const { data: weekOrders } = await supabaseAdmin
      .from('vendor_orders')
      .select('vendor_amount')
      .eq('vendor_id', vendor.id)
      .gte('created_at', weekAgoISO)

    const weekRevenue = weekOrders?.reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0
    const weekOrderCount = weekOrders?.length || 0

    // Low stock count
    const { count: lowStockCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .lt('stock_quantity', 10)

    // Pending reviews count
    const productIds = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('vendor_id', vendor.id)

    let pendingReviews = 0
    const pIds = productIds.data?.map(p => p.id) || []
    if (pIds.length > 0) {
      const { count: reviewCount } = await supabaseAdmin
        .from('product_reviews')
        .select('*', { count: 'exact', head: true })
        .in('product_id', pIds)
        .eq('status', 'pending')

      pendingReviews = reviewCount || 0
    }

    // Average rating
    let averageRating = 0
    if (pIds.length > 0) {
      const { data: ratings } = await supabaseAdmin
        .from('product_reviews')
        .select('rating')
        .in('product_id', pIds)
        .eq('status', 'approved')

      if (ratings && ratings.length > 0) {
        averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      }
    }

    // Platform benchmarks (averages across all vendors)
    const { data: allVendorOrders } = await supabaseAdmin
      .from('vendor_orders')
      .select('vendor_id, vendor_amount')
      .not('status', 'eq', 'cancelled')

    let platformAvgRevenue = 0
    let platformAvgOrders = 0
    if (allVendorOrders && allVendorOrders.length > 0) {
      const vendorGroups = new Map<string, { revenue: number; orders: number }>()
      for (const vo of allVendorOrders) {
        const existing = vendorGroups.get(vo.vendor_id) || { revenue: 0, orders: 0 }
        existing.revenue += vo.vendor_amount || 0
        existing.orders++
        vendorGroups.set(vo.vendor_id, existing)
      }
      const vendorCount = vendorGroups.size
      if (vendorCount > 0) {
        const totals = Array.from(vendorGroups.values())
        platformAvgRevenue = Math.round(totals.reduce((s, v) => s + v.revenue, 0) / vendorCount)
        platformAvgOrders = Math.round(totals.reduce((s, v) => s + v.orders, 0) / vendorCount)
      }
    }

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalOrders,
      pendingOrders,
      totalRevenue,
      pendingPayout,
      todayOrderCount,
      todayRevenue,
      weekOrderCount,
      weekRevenue,
      lowStockCount: lowStockCount || 0,
      pendingReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      benchmarks: {
        platformAvgRevenue,
        platformAvgOrders,
        yourRevenue: totalRevenue,
        yourOrders: totalOrders,
        revenueVsPlatform: platformAvgRevenue > 0 ? Math.round(((totalRevenue - platformAvgRevenue) / platformAvgRevenue) * 100) : 0,
        ordersVsPlatform: platformAvgOrders > 0 ? Math.round(((totalOrders - platformAvgOrders) / platformAvgOrders) * 100) : 0,
      },
    })
  } catch (error) {
    console.error('Vendor stats error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
