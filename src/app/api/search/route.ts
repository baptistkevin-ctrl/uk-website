import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cached, TTL } from '@/lib/cache'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawQuery = searchParams.get('q') || ''
  // Cap query length to prevent abuse
  const query = rawQuery.slice(0, 200)
  const page = Math.min(Math.max(parseInt(searchParams.get('page') || '1') || 1, 1), 100)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 50)
  const sortBy = searchParams.get('sort') || 'relevance'
  const category = searchParams.get('category')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const inStock = searchParams.get('inStock') === 'true'
  const onSale = searchParams.get('onSale') === 'true'
  const isOrganic = searchParams.get('organic') === 'true'
  const isVegan = searchParams.get('vegan') === 'true'
  const isVegetarian = searchParams.get('vegetarian') === 'true'
  const isGlutenFree = searchParams.get('glutenFree') === 'true'
  const brand = searchParams.get('brand')
  const vendor = searchParams.get('vendor')

  // Cap offset to prevent Supabase range errors on very high page numbers
  const offset = Math.min((page - 1) * limit, 5000)
  const supabase = getSupabaseAdmin()

  try {
    // Build the query
    let dbQuery = supabase
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
        is_active,
        has_offer,
        offer_badge,
        avg_rating,
        review_count,
        vendor_id,
        vendor:vendors(id, business_name, slug, is_verified),
        categories:product_categories(category:categories(id, name, slug))
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('approval_status', 'approved')

    // Text search - search in name and description
    if (query) {
      // Sanitize query: escape LIKE wildcards, then strip PostgREST operators and injection chars
      const sanitizedQuery = query
        .replace(/[%_\\]/g, '\\$&')
        .replace(/[.,()<>'";\[\]{}|]/g, '')
      dbQuery = dbQuery.or(`name.ilike.%${sanitizedQuery}%,short_description.ilike.%${sanitizedQuery}%,brand.ilike.%${sanitizedQuery}%`)
    }

    // Category filter
    if (category) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()

      if (categoryData) {
        const { data: productIds } = await supabase
          .from('product_categories')
          .select('product_id')
          .eq('category_id', categoryData.id)

        if (productIds && productIds.length > 0) {
          dbQuery = dbQuery.in('id', productIds.map(p => p.product_id))
        }
      }
    }

    // Price filters
    if (minPrice) {
      dbQuery = dbQuery.gte('price_pence', parseInt(minPrice))
    }
    if (maxPrice) {
      dbQuery = dbQuery.lte('price_pence', parseInt(maxPrice))
    }

    // Stock filter
    if (inStock) {
      dbQuery = dbQuery.gt('stock_quantity', 0)
    }

    // On sale filter
    if (onSale) {
      dbQuery = dbQuery.not('compare_at_price_pence', 'is', null)
    }

    // Dietary filters
    if (isOrganic) {
      dbQuery = dbQuery.eq('is_organic', true)
    }
    if (isVegan) {
      dbQuery = dbQuery.eq('is_vegan', true)
    }
    if (isVegetarian) {
      dbQuery = dbQuery.eq('is_vegetarian', true)
    }
    if (isGlutenFree) {
      dbQuery = dbQuery.eq('is_gluten_free', true)
    }

    // Brand filter
    if (brand) {
      dbQuery = dbQuery.eq('brand', brand)
    }

    // Vendor filter
    if (vendor) {
      dbQuery = dbQuery.eq('vendor_id', vendor)
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        dbQuery = dbQuery.order('price_pence', { ascending: true })
        break
      case 'price_desc':
        dbQuery = dbQuery.order('price_pence', { ascending: false })
        break
      case 'rating':
        dbQuery = dbQuery.order('avg_rating', { ascending: false })
        break
      case 'newest':
        dbQuery = dbQuery.order('created_at', { ascending: false })
        break
      case 'popular':
        dbQuery = dbQuery.order('review_count', { ascending: false })
        break
      default: // relevance - for now just use newest
        dbQuery = dbQuery.order('created_at', { ascending: false })
    }

    // Execute query with pagination
    const { data: products, error, count } = await dbQuery.range(offset, offset + limit - 1)

    if (error) {
      console.error('Search error:', JSON.stringify(error))
      // Supabase returns error when range exceeds total rows - return empty results gracefully
      return NextResponse.json({
        products: [],
        total: 0,
        page,
        totalPages: 0,
        facets: { categories: [], brands: [], priceRange: { min: 0, max: 0 } },
        query: query.replace(/[<>"'&]/g, ''),
      })
    }

    // Get facets (cached - these rarely change)
    const facetData = await cached(
      'search:facets',
      async () => {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from('products')
            .select('brand, price_pence')
            .eq('is_active', true)
            .eq('approval_status', 'approved'),
          supabase
            .from('categories')
            .select('id, name, slug')
            .eq('is_active', true)
            .order('display_order'),
        ])

        const allProducts = productsRes.data || []
        const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))]
        const prices = allProducts.map(p => p.price_pence)
        const priceRange = {
          min: prices.length ? Math.min(...prices) : 0,
          max: prices.length ? Math.max(...prices) : 0,
        }

        return {
          brands,
          priceRange,
          categories: categoriesRes.data || [],
        }
      },
      TTL.LONG,
      ['search:facets', 'products', 'categories']
    )

    const { brands, priceRange, categories } = facetData

    // Sanitize query for response to prevent reflected XSS
    const safeQuery = query.replace(/[<>"'&]/g, '')

    return NextResponse.json({
      products,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      facets: {
        categories: categories || [],
        brands,
        priceRange,
      },
      query: safeQuery,
    })
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      context: 'api:search',
      extra: { query: rawQuery?.slice(0, 50) },
    })
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
