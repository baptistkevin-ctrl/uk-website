import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
}

async function isAdmin() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' || profile?.role === 'super_admin'
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const thisMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

  try {
    // Safe query helper - returns empty result if table doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeQuery = async (query: PromiseLike<any>): Promise<{ data: any; error: any; count: number }> => {
      try {
        const result = await query
        if (result.error) return { data: null, error: result.error, count: 0 }
        return { data: result.data, error: null, count: result.count ?? 0 }
      } catch {
        return { data: null, error: null, count: 0 }
      }
    }

    // Run ALL queries in parallel for maximum speed
    const [
      ordersResult,
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
    ] = await Promise.all([
      // Orders
      safeQuery(supabase
        .from('orders')
        .select('id, total_pence, status, payment_status, created_at')
        .order('created_at', { ascending: false })),

      // Users counts
      safeQuery(supabase.from('profiles').select('*', { count: 'exact', head: true })),
      safeQuery(supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today)),
      safeQuery(supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', `${thisMonth}-01`)),

      // Products
      safeQuery(supabase.from('products').select('id, stock_quantity, low_stock_threshold, is_active, approval_status')),

      // Vendors
      safeQuery(supabase.from('vendors').select('*', { count: 'exact', head: true })),
      safeQuery(supabase.from('vendor_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending')),

      // Reviews
      safeQuery(supabase.from('product_reviews').select('*', { count: 'exact', head: true })),
      safeQuery(supabase.from('product_reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending')),

      // Marketing
      safeQuery(supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('is_active', true)),
      safeQuery(supabase.from('flash_deals').select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('starts_at', now.toISOString())
        .gte('ends_at', now.toISOString())),

      // Recent activity
      safeQuery(supabase.from('orders')
        .select('id, order_number, customer_name, customer_email, total_pence, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)),

      safeQuery(supabase.from('product_reviews')
        .select(`id, rating, title, status, created_at, profiles:user_id (full_name, email), products:product_id (name, slug)`)
        .order('created_at', { ascending: false })
        .limit(5)),

      safeQuery(supabase.from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5)),

      // Top products
      safeQuery(supabase.from('order_items')
        .select('product_id, quantity, products:product_id (name, slug, image_url)')
        .limit(100)),
    ])

    // Process orders data
    const orders: any[] = ordersResult.data || []
    const paidOrders = orders.filter((o: any) => o.payment_status === 'paid')
    const todayOrders = orders.filter((o: any) => o.created_at?.startsWith(today))
    const thisMonthOrders = orders.filter((o: any) => o.created_at?.startsWith(thisMonth))

    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.total_pence || 0), 0)
    const thisMonthRevenue = paidOrders
      .filter((o: any) => o.created_at?.startsWith(thisMonth))
      .reduce((sum: number, o: any) => sum + (o.total_pence || 0), 0)
    const lastMonthRevenue = paidOrders
      .filter((o: any) => o.created_at?.startsWith(lastMonth))
      .reduce((sum: number, o: any) => sum + (o.total_pence || 0), 0)

    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 100

    const ordersByStatus = {
      pending: orders.filter((o: any) => o.status === 'pending').length,
      confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
      processing: orders.filter((o: any) => o.status === 'processing').length,
      shipped: orders.filter((o: any) => o.status === 'out_for_delivery' || o.status === 'ready_for_delivery').length,
      delivered: orders.filter((o: any) => o.status === 'delivered').length,
      cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
    }

    // Process products data
    const products: any[] = productsResult.data || []
    const totalProducts = products.length
    const activeProducts = products.filter((p: any) => p.is_active && p.approval_status === 'approved').length
    const lowStockProducts = products.filter((p: any) =>
      p.stock_quantity <= (p.low_stock_threshold || 5) && p.is_active
    ).length
    const outOfStockProducts = products.filter((p: any) => p.stock_quantity <= 0 && p.is_active).length
    const pendingApproval = products.filter((p: any) => p.approval_status === 'pending').length

    // Sales by day (last 7 days)
    const salesByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayOrders = paidOrders.filter((o: any) => o.created_at?.startsWith(dateStr))
      salesByDay.push({
        date: dateStr,
        day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum: number, o: any) => sum + (o.total_pence || 0), 0),
      })
    }

    // Sales by month (last 6 months)
    const salesByMonth = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toISOString().slice(0, 7)
      const monthOrders = paidOrders.filter((o: any) => o.created_at?.startsWith(monthStr))
      salesByMonth.push({
        month: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        orders: monthOrders.length,
        revenue: monthOrders.reduce((sum: number, o: any) => sum + (o.total_pence || 0), 0),
      })
    }

    // Process top products
    const productSales = new Map()
    topProductsResult.data?.forEach((item: any) => {
      const id = item.product_id
      if (!productSales.has(id)) {
        productSales.set(id, {
          id,
          name: (item.products as any)?.name || 'Unknown',
          slug: (item.products as any)?.slug,
          image_url: (item.products as any)?.image_url,
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
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        thisMonthOrders: thisMonthOrders.length,
        averageOrderValue: paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0,
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
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
