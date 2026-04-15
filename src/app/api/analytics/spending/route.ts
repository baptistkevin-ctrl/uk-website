import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface OrderRow {
  id: string
  total_pence: number
  delivery_fee_pence: number
  created_at: string
  status: string
}

interface OrderItemRow {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image_url: string | null
  quantity: number
  unit_price_pence: number
  total_price_pence: number
}

interface ProductRow {
  id: string
  price_pence: number
  compare_at_price_pence: number | null
}

interface CategoryRow {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

interface ProductCategoryRow {
  product_id: string
  category_id: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = Math.min(Math.max(parseInt(searchParams.get('period') || '12', 10), 1), 60)

    const admin = getSupabaseAdmin()
    const periodStart = new Date()
    periodStart.setMonth(periodStart.getMonth() - period)

    // Fetch orders within period (exclude cancelled)
    const { data: orders, error: ordersError } = await admin
      .from('orders')
      .select('id, total_pence, delivery_fee_pence, created_at, status')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .gte('created_at', periodStart.toISOString())
      .order('created_at', { ascending: true })

    if (ordersError) {
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    const typedOrders: OrderRow[] = orders || []

    if (typedOrders.length === 0) {
      return NextResponse.json(buildEmptyResponse())
    }

    const orderIds = typedOrders.map(o => o.id)

    // Fetch order items, products (for compare_at_price), categories, and product_categories in parallel
    const [itemsResult, productsResult, categoriesResult, productCatsResult, budgetResult] = await Promise.all([
      admin
        .from('order_items')
        .select('id, order_id, product_id, product_name, product_image_url, quantity, unit_price_pence, total_price_pence')
        .in('order_id', orderIds),
      admin
        .from('products')
        .select('id, price_pence, compare_at_price_pence'),
      admin
        .from('categories')
        .select('id, name, slug, parent_id'),
      admin
        .from('product_categories')
        .select('product_id, category_id'),
      admin
        .from('profiles')
        .select('monthly_budget_pence')
        .eq('id', user.id)
        .single(),
    ])

    const items: OrderItemRow[] = itemsResult.data || []
    const products: ProductRow[] = productsResult.data || []
    const categories: CategoryRow[] = categoriesResult.data || []
    const productCats: ProductCategoryRow[] = productCatsResult.data || []

    // Build lookup maps
    const productMap = new Map(products.map(p => [p.id, p]))
    const categoryMap = new Map(categories.map(c => [c.id, c]))
    const productToCats = new Map<string, string[]>()
    for (const pc of productCats) {
      const existing = productToCats.get(pc.product_id) || []
      existing.push(pc.category_id)
      productToCats.set(pc.product_id, existing)
    }

    // Build order-to-items map
    const orderItemsMap = new Map<string, OrderItemRow[]>()
    for (const item of items) {
      const existing = orderItemsMap.get(item.order_id) || []
      existing.push(item)
      orderItemsMap.set(item.order_id, existing)
    }

    // --- Summary ---
    const totalSpent = typedOrders.reduce((sum, o) => sum + o.total_pence, 0)
    const totalOrders = typedOrders.length
    const avgOrderValue = Math.round(totalSpent / totalOrders)
    const totalDeliveryFees = typedOrders.reduce((sum, o) => sum + o.delivery_fee_pence, 0)
    const freeDeliveryCount = typedOrders.filter(o => o.delivery_fee_pence === 0).length

    // Calculate savings: compare_at_price - actual price paid, per item
    let totalSaved = 0
    for (const item of items) {
      if (!item.product_id) continue
      const product = productMap.get(item.product_id)
      if (product?.compare_at_price_pence && product.compare_at_price_pence > item.unit_price_pence) {
        totalSaved += (product.compare_at_price_pence - item.unit_price_pence) * item.quantity
      }
    }

    // --- Monthly Breakdown ---
    const monthlyMap = new Map<string, { spent: number; orderCount: number; savings: number }>()

    for (const order of typedOrders) {
      const monthKey = order.created_at.slice(0, 7) // "YYYY-MM"
      const entry = monthlyMap.get(monthKey) || { spent: 0, orderCount: 0, savings: 0 }
      entry.spent += order.total_pence
      entry.orderCount += 1
      monthlyMap.set(monthKey, entry)
    }

    // Add per-item savings to monthly
    for (const item of items) {
      const order = typedOrders.find(o => o.id === item.order_id)
      if (!order || !item.product_id) continue
      const product = productMap.get(item.product_id)
      if (product?.compare_at_price_pence && product.compare_at_price_pence > item.unit_price_pence) {
        const monthKey = order.created_at.slice(0, 7)
        const entry = monthlyMap.get(monthKey)
        if (entry) {
          entry.savings += (product.compare_at_price_pence - item.unit_price_pence) * item.quantity
        }
      }
    }

    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        monthLabel: MONTH_LABELS[parseInt(month.slice(5, 7), 10) - 1],
        spent: data.spent,
        orderCount: data.orderCount,
        avgOrderValue: data.orderCount > 0 ? Math.round(data.spent / data.orderCount) : 0,
        savings: data.savings,
      }))

    const avgMonthlySpend = monthly.length > 0
      ? Math.round(totalSpent / monthly.length)
      : 0

    // --- Category Breakdown ---
    const categorySpendMap = new Map<string, { totalSpent: number; itemCount: number; products: Map<string, number> }>()

    for (const item of items) {
      if (!item.product_id) continue
      const catIds = productToCats.get(item.product_id) || []

      // Resolve to parent category for grouping
      for (const catId of catIds) {
        const parentCat = resolveParentCategory(catId, categoryMap)
        if (!parentCat) continue

        const entry = categorySpendMap.get(parentCat.id) || {
          totalSpent: 0,
          itemCount: 0,
          products: new Map<string, number>(),
        }
        entry.totalSpent += item.total_price_pence
        entry.itemCount += item.quantity
        entry.products.set(
          item.product_name,
          (entry.products.get(item.product_name) || 0) + item.total_price_pence
        )
        categorySpendMap.set(parentCat.id, entry)
      }
    }

    const totalItemSpend = items.reduce((sum, i) => sum + i.total_price_pence, 0)
    const categoryBreakdown = Array.from(categorySpendMap.entries())
      .map(([catId, data]) => {
        const cat = categoryMap.get(catId)
        let topProduct = 'Unknown'
        let topProductSpend = 0
        for (const [name, spend] of data.products) {
          if (spend > topProductSpend) {
            topProduct = name
            topProductSpend = spend
          }
        }
        return {
          categoryName: cat?.name || 'Uncategorised',
          categorySlug: cat?.slug || 'uncategorised',
          totalSpent: data.totalSpent,
          percentage: totalItemSpend > 0 ? Math.round((data.totalSpent / totalItemSpend) * 10000) / 100 : 0,
          itemCount: data.itemCount,
          topProduct,
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)

    // --- Top Products ---
    const productSpendMap = new Map<string, { name: string; image: string | null; totalSpent: number; count: number; prices: number[] }>()

    for (const item of items) {
      const key = item.product_id || item.product_name
      const entry = productSpendMap.get(key) || {
        name: item.product_name,
        image: item.product_image_url,
        totalSpent: 0,
        count: 0,
        prices: [],
      }
      entry.totalSpent += item.total_price_pence
      entry.count += item.quantity
      entry.prices.push(item.unit_price_pence)
      productSpendMap.set(key, entry)
    }

    const topProducts = Array.from(productSpendMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(p => ({
        productName: p.name,
        productImage: p.image,
        totalSpent: p.totalSpent,
        purchaseCount: p.count,
        avgPrice: p.prices.length > 0 ? Math.round(p.prices.reduce((s, v) => s + v, 0) / p.prices.length) : 0,
      }))

    // --- Trends ---
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
    const avgItemsPerOrder = totalOrders > 0 ? Math.round((totalItems / totalOrders) * 10) / 10 : 0

    const orderTotals = typedOrders.map(o => o.total_pence)
    const mostExpensiveOrder = Math.max(...orderTotals)
    const cheapestOrder = Math.min(...orderTotals)

    // Busiest day of week
    const dayCount = new Array<number>(7).fill(0)
    for (const order of typedOrders) {
      const day = new Date(order.created_at).getDay()
      dayCount[day] += 1
    }
    const busiestDayIndex = dayCount.indexOf(Math.max(...dayCount))
    const busiestDay = DAY_NAMES[busiestDayIndex]

    // Spending trend: compare last 2 months with data
    const sortedMonths = monthly.map(m => m.spent)
    let spendingTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    let percentChange = 0

    if (sortedMonths.length >= 2) {
      const lastMonth = sortedMonths[sortedMonths.length - 1]
      const prevMonth = sortedMonths[sortedMonths.length - 2]
      if (prevMonth > 0) {
        percentChange = Math.round(((lastMonth - prevMonth) / prevMonth) * 10000) / 100
        if (percentChange > 5) spendingTrend = 'increasing'
        else if (percentChange < -5) spendingTrend = 'decreasing'
      } else if (lastMonth > 0) {
        percentChange = 100
        spendingTrend = 'increasing'
      }
    }

    // --- Budget ---
    let budget = null
    const budgetValue = budgetResult.data?.monthly_budget_pence as number | null | undefined

    if (budgetValue && budgetValue > 0) {
      const now = new Date()
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const currentMonthData = monthlyMap.get(currentMonthKey)
      const currentMonthSpent = currentMonthData?.spent || 0

      const dayOfMonth = now.getDate()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const daysRemaining = daysInMonth - dayOfMonth

      const dailyRate = dayOfMonth > 0 ? currentMonthSpent / dayOfMonth : 0
      const projectedTotal = Math.round(dailyRate * daysInMonth)
      const percentUsed = Math.round((currentMonthSpent / budgetValue) * 10000) / 100

      budget = {
        monthlyBudget: budgetValue,
        currentMonthSpent,
        percentUsed,
        daysRemaining,
        projectedTotal,
        onTrack: projectedTotal <= budgetValue,
      }
    }

    return NextResponse.json({
      summary: {
        totalSpent,
        totalOrders,
        avgOrderValue,
        avgMonthlySpend,
        totalSaved,
        totalDeliveryFees,
        freeDeliveryCount,
      },
      monthly,
      categoryBreakdown,
      topProducts,
      trends: {
        spendingTrend,
        percentChange,
        busiestDay,
        avgItemsPerOrder,
        mostExpensiveOrder,
        cheapestOrder,
      },
      budget,
    })
  } catch (error) {
    console.error('Spending analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to generate spending analytics' },
      { status: 500 }
    )
  }
}

function resolveParentCategory(
  categoryId: string,
  categoryMap: Map<string, CategoryRow>
): CategoryRow | null {
  let current = categoryMap.get(categoryId)
  if (!current) return null

  // Walk up to root parent
  const visited = new Set<string>()
  while (current?.parent_id && !visited.has(current.id)) {
    visited.add(current.id)
    const parent = categoryMap.get(current.parent_id)
    if (!parent) break
    current = parent
  }

  return current
}

function buildEmptyResponse() {
  return {
    summary: {
      totalSpent: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      avgMonthlySpend: 0,
      totalSaved: 0,
      totalDeliveryFees: 0,
      freeDeliveryCount: 0,
    },
    monthly: [],
    categoryBreakdown: [],
    topProducts: [],
    trends: {
      spendingTrend: 'stable' as const,
      percentChange: 0,
      busiestDay: 'Monday',
      avgItemsPerOrder: 0,
      mostExpensiveOrder: 0,
      cheapestOrder: 0,
    },
    budget: null,
  }
}
