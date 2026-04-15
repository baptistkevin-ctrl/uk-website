import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET - Get store products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
  const sortBy = searchParams.get('sort') || 'newest' // newest, price_asc, price_desc, rating, popular
  const category = searchParams.get('category')
  const offset = (page - 1) * limit

  const supabaseAdmin = getSupabaseAdmin()

  // Get vendor ID from slug
  const { data: vendor } = await supabaseAdmin
    .from('vendors')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!vendor) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  // Build products query
  let query = supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      slug,
      short_description,
      price_pence,
      compare_at_price_pence,
      image_url,
      stock_quantity,
      unit,
      unit_value,
      is_active,
      has_offer,
      offer_badge,
      avg_rating,
      review_count,
      categories:product_categories(
        category:categories(id, name, slug)
      )
    `, { count: 'exact' })
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  // Category filter
  if (category) {
    const { data: categoryData } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()

    if (categoryData) {
      // This requires a join, so we filter after fetching
      // For now, we'll handle this differently
    }
  }

  // Sorting
  switch (sortBy) {
    case 'price_asc':
      query = query.order('price_pence', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price_pence', { ascending: false })
      break
    case 'rating':
      query = query.order('avg_rating', { ascending: false })
      break
    case 'popular':
      query = query.order('review_count', { ascending: false })
      break
    default: // newest
      query = query.order('created_at', { ascending: false })
  }

  const { data: products, error, count } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Store products fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }

  // Get categories for filter
  const { data: storeCategories } = await supabaseAdmin
    .from('products')
    .select(`
      product_categories(
        categories(id, name, slug)
      )
    `)
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)

  // Extract unique categories
  const categoryMap = new Map()
  storeCategories?.forEach((p: Record<string, unknown>) => {
    const productCategories = p.product_categories as Array<{ categories: { id: string; name: string; slug: string } | null }> | undefined
    productCategories?.forEach((pc) => {
      if (pc.categories) {
        categoryMap.set(pc.categories.id, pc.categories)
      }
    })
  })

  return NextResponse.json({
    products,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    categories: Array.from(categoryMap.values()),
  })
}
