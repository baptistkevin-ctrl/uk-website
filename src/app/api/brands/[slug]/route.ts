import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:brands' })

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sortBy = searchParams.get('sort') || 'newest'
  const offset = (page - 1) * limit

  const supabase = getSupabaseAdmin()

  try {
    // First, find the exact brand name from the slug
    const { data: allProducts } = await supabase
      .from('products')
      .select('brand')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .not('brand', 'is', null)

    // Find the brand that matches the slug
    const brandName = allProducts?.find(p => {
      if (!p.brand) return false
      const brandSlug = p.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      return brandSlug === slug
    })?.brand

    if (!brandName) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Build query for brand products
    let query = supabase
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
        brand,
        is_organic,
        is_vegan,
        is_vegetarian,
        is_gluten_free,
        has_offer,
        offer_badge,
        avg_rating,
        review_count,
        vendor_id,
        vendor:vendors(id, business_name, slug, is_verified)
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .eq('brand', brandName)

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
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data: products, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      log.error('Error fetching brand products', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Get price range for this brand
    const prices = products?.map(p => p.price_pence) || []
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    }

    return NextResponse.json({
      brand: {
        name: brandName,
        slug,
        product_count: count || 0,
      },
      products,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      priceRange,
    })
  } catch (error) {
    log.error('Error fetching brand', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 })
  }
}
