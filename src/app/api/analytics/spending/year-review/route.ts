import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface OrderItemRow {
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price_pence: number
  total_price_pence: number
}

interface ProductRow {
  id: string
  compare_at_price_pence: number | null
}

interface ProductCategoryRow {
  product_id: string
  category_id: string
}

interface CategoryRow {
  id: string
  name: string
  parent_id: string | null
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
    const currentYear = new Date().getFullYear()
    const year = parseInt(searchParams.get('year') || String(currentYear), 10)

    if (year < 2020 || year > currentYear + 1) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const yearStart = `${year}-01-01T00:00:00.000Z`
    const yearEnd = `${year + 1}-01-01T00:00:00.000Z`

    // Fetch orders for the year (exclude cancelled)
    const { data: orders, error: ordersError } = await admin
      .from('orders')
      .select('id, total_pence, created_at, status')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd)
      .order('created_at', { ascending: true })

    if (ordersError) {
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        year,
        totalSpent: 0,
        totalOrders: 0,
        totalItems: 0,
        totalSaved: 0,
        favouriteCategory: 'N/A',
        mostBoughtProduct: { name: 'N/A', count: 0 },
        busiestMonth: 'N/A',
        greenScore: 'N/A',
        loyaltyTier: 'Standard',
        memberSince: user.created_at || 'Unknown',
      })
    }

    const orderIds = orders.map(o => o.id)

    // Fetch items, products, categories, product_categories, loyalty, carbon, and profile in parallel
    const [
      itemsResult,
      productsResult,
      categoriesResult,
      productCatsResult,
      loyaltyResult,
      carbonResult,
      profileResult,
    ] = await Promise.all([
      admin
        .from('order_items')
        .select('order_id, product_id, product_name, quantity, unit_price_pence, total_price_pence')
        .in('order_id', orderIds),
      admin
        .from('products')
        .select('id, compare_at_price_pence'),
      admin
        .from('categories')
        .select('id, name, parent_id'),
      admin
        .from('product_categories')
        .select('product_id, category_id'),
      admin
        .from('loyalty_tiers')
        .select('name')
        .limit(1)
        .then(() =>
          admin
            .rpc('get_or_create_loyalty_account', { p_user_id: user.id })
            .then(res => res)
        )
        .then(res => res, () => ({ data: null, error: null })),
      Promise.resolve(
        admin
          .from('carbon_footprints')
          .select('score')
          .eq('user_id', user.id)
          .single()
      ).then(res => res, () => ({ data: null, error: null })),
      admin
        .from('profiles')
        .select('created_at')
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

    // Totals
    const totalSpent = orders.reduce((sum, o) => sum + o.total_pence, 0)
    const totalOrders = orders.length
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

    // Savings
    let totalSaved = 0
    for (const item of items) {
      if (!item.product_id) continue
      const product = productMap.get(item.product_id)
      if (product?.compare_at_price_pence && product.compare_at_price_pence > item.unit_price_pence) {
        totalSaved += (product.compare_at_price_pence - item.unit_price_pence) * item.quantity
      }
    }

    // Most bought product
    const productCountMap = new Map<string, { name: string; count: number }>()
    for (const item of items) {
      const key = item.product_id || item.product_name
      const entry = productCountMap.get(key) || { name: item.product_name, count: 0 }
      entry.count += item.quantity
      productCountMap.set(key, entry)
    }

    let mostBoughtProduct = { name: 'N/A', count: 0 }
    for (const entry of productCountMap.values()) {
      if (entry.count > mostBoughtProduct.count) {
        mostBoughtProduct = entry
      }
    }

    // Favourite category (by total spend, resolved to parent)
    const categorySpendMap = new Map<string, { name: string; totalSpent: number }>()
    for (const item of items) {
      if (!item.product_id) continue
      const catIds = productToCats.get(item.product_id) || []
      for (const catId of catIds) {
        const parentCat = resolveParentCategory(catId, categoryMap)
        if (!parentCat) continue
        const entry = categorySpendMap.get(parentCat.id) || { name: parentCat.name, totalSpent: 0 }
        entry.totalSpent += item.total_price_pence
        categorySpendMap.set(parentCat.id, entry)
      }
    }

    let favouriteCategory = 'N/A'
    let maxCatSpend = 0
    for (const entry of categorySpendMap.values()) {
      if (entry.totalSpent > maxCatSpend) {
        favouriteCategory = entry.name
        maxCatSpend = entry.totalSpent
      }
    }

    // Busiest month
    const monthSpendMap = new Map<string, number>()
    for (const order of orders) {
      const monthIndex = parseInt(order.created_at.slice(5, 7), 10) - 1
      const label = MONTH_LABELS[monthIndex]
      monthSpendMap.set(label, (monthSpendMap.get(label) || 0) + 1)
    }

    let busiestMonth = 'N/A'
    let maxMonthOrders = 0
    for (const [month, count] of monthSpendMap) {
      if (count > maxMonthOrders) {
        busiestMonth = month
        maxMonthOrders = count
      }
    }

    // Green score (from carbon data if available)
    const greenScore = (carbonResult as { data: { score: string } | null }).data?.score || 'N/A'

    // Loyalty tier
    const loyaltyData = loyaltyResult as { data: { tier_name: string } | null }
    const loyaltyTier = loyaltyData.data?.tier_name || 'Standard'

    // Member since
    const memberSince = profileResult.data?.created_at || user.created_at || 'Unknown'

    return NextResponse.json({
      year,
      totalSpent,
      totalOrders,
      totalItems,
      totalSaved,
      favouriteCategory,
      mostBoughtProduct,
      busiestMonth,
      greenScore,
      loyaltyTier,
      memberSince,
    })
  } catch (error) {
    console.error('Year review error:', error)
    return NextResponse.json(
      { error: 'Failed to generate year review' },
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

  const visited = new Set<string>()
  while (current?.parent_id && !visited.has(current.id)) {
    visited.add(current.id)
    const parent = categoryMap.get(current.parent_id)
    if (!parent) break
    current = parent
  }

  return current
}
