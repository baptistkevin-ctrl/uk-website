import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'admin:dashboard' })

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const supabase = getSupabaseAdmin()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const thisMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

  try {
    // Calculate date boundaries for filtered queries
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString()

    // Run ALL queries in parallel for maximum speed
    const [
      // Only fetch orders from last 6 months for chart data (not ALL orders ever)
      recentOrdersForStatsResult,
      totalOrdersResult,
      totalPaidRevenueResult,
      totalUsersResult,
      newUsersTodayResult,
      newUsersThisMonthResult,
      productsResult,
      totalVendorsResult,
      pendingVendorApplicationsResult,
      totalReviewsResult,
      pendingReviewsResult,
      activeCouponsResult,
      activeDealsResult,
      recentOrdersResult,
      recentReviewsResult,
      recentUsersResult,
      topProductsResult,
      // Status-specific order counts
      pendingOrdersResult,
      confirmedOrdersResult,
      processingOrdersResult,
      shippedOrdersResult,
      deliveredOrdersResult,
      cancelledOrdersResult,
    ] = await Promise.all([
      // Orders from last 6 months only (for charts)
      supabase
        .from('orders')
        .select('id, total_pence, status, payment_status, created_at')
        .gte('created_at', sixMonthsAgo)
        .order('created_at', { ascending: false })
        .limit(5000),

      // Total order count
      supabase.from('orders').select('*', { count: 'exact', head: true }),

      // Total paid revenue
      supabase.from('orders')
        .select('total_pence')
        .eq('payment_status', 'paid'),

      // Users counts
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', `${thisMonth}-01`),

      // Products
      supabase.from('products').select('id, stock_quantity, low_stock_threshold, is_active, approval_status'),

      // Vendors
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('vendor_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

      // Reviews
      supabase.from('product_reviews').select('*', { count: 'exact', head: true }),
      supabase.from('product_reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

      // Marketing
      supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('flash_deals').select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('starts_at', now.toISOString())
        .gte('ends_at', now.toISOString()),

      // Recent activity
      supabase.from('orders')
        .select('id, order_number, customer_name, customer_email, total_pence, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      supabase.from('product_reviews')
        .select(`id, rating, title, status, created_at, profiles:user_id (full_name, email), products:product_id (name, slug)`)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase.from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5),

      // Top products
      supabase.from('order_items')
        .select('product_id, quantity, products:product_id (name, slug, image_url)')
        .limit(100),

      // Order counts by status (using count queries instead of fetching all rows)
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).or('status.eq.out_for_delivery,status.eq.ready_for_delivery'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    ])

    // Process orders data (only recent orders for charts, not all-time)
    const recentOrders = recentOrdersForStatsResult.data || []
    const paidOrders = recentOrders.filter(o => o.payment_status === 'paid')
    const todayOrders = recentOrders.filter(o => o.created_at?.startsWith(today))
    const thisMonthOrders = recentOrders.filter(o => o.created_at?.startsWith(thisMonth))

    // Total revenue from all paid orders
    const allPaidOrders = totalPaidRevenueResult.data || []
    const totalRevenue = allPaidOrders.reduce((sum, o) => sum + (o.total_pence || 0), 0)
    const thisMonthRevenue = paidOrders
      .filter(o => o.created_at?.startsWith(thisMonth))
      .reduce((sum, o) => sum + (o.total_pence || 0), 0)
    const lastMonthRevenue = paidOrders
      .filter(o => o.created_at?.startsWith(lastMonth))
      .reduce((sum, o) => sum + (o.total_pence || 0), 0)

    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 100

    // Use count queries for order status instead of filtering all rows in memory
    const ordersByStatus = {
      pending: pendingOrdersResult.count || 0,
      confirmed: confirmedOrdersResult.count || 0,
      processing: processingOrdersResult.count || 0,
      shipped: shippedOrdersResult.count || 0,
      delivered: deliveredOrdersResult.count || 0,
      cancelled: cancelledOrdersResult.count || 0,
    }

    // Process products data
    const products = productsResult.data || []
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.is_active && p.approval_status === 'approved').length
    const lowStockProducts = products.filter(p =>
      p.stock_quantity <= (p.low_stock_threshold || 5) && p.is_active
    ).length
    const outOfStockProducts = products.filter(p => p.stock_quantity <= 0 && p.is_active).length
    const pendingApproval = products.filter(p => p.approval_status === 'pending').length

    // Sales by day (last 7 days)
    const salesByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayOrders = paidOrders.filter(o => o.created_at?.startsWith(dateStr))
      salesByDay.push({
        date: dateStr,
        day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (o.total_pence || 0), 0),
      })
    }

    // Sales by month (last 6 months)
    const salesByMonth = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toISOString().slice(0, 7)
      const monthOrders = paidOrders.filter(o => o.created_at?.startsWith(monthStr))
      salesByMonth.push({
        month: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        orders: monthOrders.length,
        revenue: monthOrders.reduce((sum, o) => sum + (o.total_pence || 0), 0),
      })
    }

    // Process top products
    const productSales = new Map()
    topProductsResult.data?.forEach(item => {
      const id = item.product_id
      const productInfo = item.products as { name?: string; slug?: string; image_url?: string } | null
      if (!productSales.has(id)) {
        productSales.set(id, {
          id,
          name: productInfo?.name || 'Unknown',
          slug: productInfo?.slug,
          image_url: productInfo?.image_url,
          quantity: 0,
        })
      }
      productSales.get(id).quantity += item.quantity
    })

    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Extract counts
    const totalUsers = totalUsersResult.count || 0
    const newUsersToday = newUsersTodayResult.count || 0
    const newUsersThisMonth = newUsersThisMonthResult.count || 0
    const totalVendors = totalVendorsResult.count || 0
    const pendingVendorApplications = pendingVendorApplicationsResult.count || 0
    const totalReviews = totalReviewsResult.count || 0
    const pendingReviews = pendingReviewsResult.count || 0
    const activeCoupons = activeCouponsResult.count || 0
    const activeDeals = activeDealsResult.count || 0

    return NextResponse.json({
      overview: {
        totalRevenue,
        thisMonthRevenue,
        revenueChange,
        totalOrders: totalOrdersResult.count || 0,
        todayOrders: todayOrders.length,
        thisMonthOrders: thisMonthOrders.length,
        averageOrderValue: allPaidOrders.length > 0 ? Math.round(totalRevenue / allPaidOrders.length) : 0,
      },
      orders: {
        byStatus: ordersByStatus,
        recent: recentOrdersResult.data || [],
      },
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
        recent: recentUsersResult.data || [],
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        pendingApproval,
        topSelling: topSellingProducts,
      },
      vendors: {
        total: totalVendors,
        pendingApplications: pendingVendorApplications,
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews,
        recent: recentReviewsResult.data || [],
      },
      marketing: {
        activeCoupons,
        activeDeals,
      },
      charts: {
        salesByDay,
        salesByMonth,
      },
      alerts: [
        ...(pendingReviews > 0 ? [{
          type: 'warning',
          title: 'Pending Reviews',
          message: `${pendingReviews} reviews waiting for moderation`,
          link: '/admin/reviews',
        }] : []),
        ...(lowStockProducts > 0 ? [{
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockProducts} products are running low on stock`,
          link: '/admin/products?stock=low',
        }] : []),
        ...(outOfStockProducts > 0 ? [{
          type: 'error',
          title: 'Out of Stock',
          message: `${outOfStockProducts} products are out of stock`,
          link: '/admin/products?stock=out',
        }] : []),
        ...(pendingVendorApplications > 0 ? [{
          type: 'info',
          title: 'Vendor Applications',
          message: `${pendingVendorApplications} vendor applications pending`,
          link: '/admin/vendor-applications',
        }] : []),
        ...(pendingApproval > 0 ? [{
          type: 'info',
          title: 'Product Approval',
          message: `${pendingApproval} products pending approval`,
          link: '/admin/products?status=pending',
        }] : []),
        ...(ordersByStatus.pending > 0 ? [{
          type: 'info',
          title: 'Pending Orders',
          message: `${ordersByStatus.pending} orders need processing`,
          link: '/admin/orders?status=pending',
        }] : []),
      ],
    })
  } catch (error) {
    log.error('Dashboard stats error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
