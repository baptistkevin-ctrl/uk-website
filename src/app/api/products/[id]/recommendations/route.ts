import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitConfigs, addRateLimitHeaders } from '@/lib/security'

export const dynamic = 'force-dynamic'

interface RecommendationParams {
  params: Promise<{ id: string }>
}

// Product type for recommendations
interface RecommendedProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  compare_at_price_pence: number | null
  image_url: string | null
  short_description: string | null
  unit: string | null
  unit_value: number | null
  is_organic: boolean
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  is_featured: boolean
  has_offer: boolean
  offer_badge: string | null
  avg_rating: number | null
  review_count: number | null
  stock_quantity: number | null
  track_inventory: boolean
  allow_backorder: boolean
  low_stock_threshold: number | null
  brand: string | null
  vendor: Array<{
    id: string
    business_name: string
    slug: string
    is_verified: boolean
  }> | null
}

// GET product recommendations
export async function GET(
  request: NextRequest,
  { params }: RecommendationParams
) {
  // Rate limiting — 30 requests per minute per IP
  const rateLimit = checkRateLimit(request, rateLimitConfigs.recommendationsGet)
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: 'Too many recommendation requests. Please slow down.' },
      { status: 429 }
    )
    return addRateLimitHeaders(response, rateLimit)
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type') || 'all' // 'similar' | 'frequent' | 'youMightLike' | 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20)

  const supabaseAdmin = getSupabaseAdmin()

  try {
    // First, get the current product to know its category
    const { data: currentProduct, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price_pence, brand, is_organic, is_vegan, is_vegetarian, is_gluten_free')
      .eq('id', id)
      .single()

    if (productError || !currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get category IDs via product_categories join table
    const { data: productCats } = await supabaseAdmin
      .from('product_categories')
      .select('category_id')
      .eq('product_id', id)
    const categoryIds = (productCats || []).map(pc => pc.category_id)

    const recommendations: {
      similar: RecommendedProduct[]
      frequentlyBoughtTogether: RecommendedProduct[]
      youMightLike: RecommendedProduct[]
    } = {
      similar: [],
      frequentlyBoughtTogether: [],
      youMightLike: []
    }

    // Get similar products (same category, similar attributes)
    if ((type === 'similar' || type === 'all') && categoryIds.length > 0) {
      // Find products in same categories via join table
      const { data: relatedProductIds } = await supabaseAdmin
        .from('product_categories')
        .select('product_id')
        .in('category_id', categoryIds)
        .neq('product_id', id)
      const relatedIds = [...new Set((relatedProductIds || []).map(r => r.product_id))]

      const { data: similarProducts } = relatedIds.length > 0 ? await supabaseAdmin
        .from('products')
        .select(`
          id,
          name,
          slug,
          price_pence,
          compare_at_price_pence,
          image_url,
          short_description,
          unit,
          unit_value,
          is_organic,
          is_vegan,
          is_vegetarian,
          is_gluten_free,
          is_featured,
          has_offer,
          offer_badge,
          avg_rating,
          review_count,
          stock_quantity,
          track_inventory,
          allow_backorder,
          low_stock_threshold,
          brand,
          vendor:vendors(
            id,
            business_name,
            slug,
            is_verified
          )
        `)
        .in('id', relatedIds)
        .eq('is_active', true)
        .order('avg_rating', { ascending: false, nullsFirst: false })
        .limit(limit) : { data: null }

      recommendations.similar = similarProducts || []
    }

    // Get frequently bought together (products from same category with similar price range)
    // In a real app, this would be based on order history analysis
    if (type === 'frequent' || type === 'all') {
      const priceRange = {
        min: Math.floor(currentProduct.price_pence * 0.5),
        max: Math.ceil(currentProduct.price_pence * 2)
      }

      const { data: frequentProducts } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          name,
          slug,
          price_pence,
          compare_at_price_pence,
          image_url,
          short_description,
          unit,
          unit_value,
          is_organic,
          is_vegan,
          is_vegetarian,
          is_gluten_free,
          is_featured,
          has_offer,
          offer_badge,
          avg_rating,
          review_count,
          stock_quantity,
          track_inventory,
          allow_backorder,
          low_stock_threshold,
          brand,
          vendor:vendors(
            id,
            business_name,
            slug,
            is_verified
          )
        `)
        .eq('is_active', true)
        .neq('id', id)
        .gte('price_pence', priceRange.min)
        .lte('price_pence', priceRange.max)
        .order('created_at', { ascending: false })
        .limit(limit * 2)

      // Fisher-Yates shuffle for unbiased randomization
      const arr = [...(frequentProducts || [])]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
      recommendations.frequentlyBoughtTogether = arr.slice(0, Math.min(limit, 4))
    }

    // Get "you might also like" - products with matching dietary preferences
    // or from the same brand, but different category
    if (type === 'youMightLike' || type === 'all') {
      // Build filter based on product attributes
      let query = supabaseAdmin
        .from('products')
        .select(`
          id,
          name,
          slug,
          price_pence,
          compare_at_price_pence,
          image_url,
          short_description,
          unit,
          unit_value,
          is_organic,
          is_vegan,
          is_vegetarian,
          is_gluten_free,
          is_featured,
          has_offer,
          offer_badge,
          avg_rating,
          review_count,
          stock_quantity,
          track_inventory,
          allow_backorder,
          low_stock_threshold,
          brand,
          vendor:vendors(
            id,
            business_name,
            slug,
            is_verified
          )
        `)
        .eq('is_active', true)
        .neq('id', id)

      // Match dietary preferences
      if (currentProduct.is_organic) {
        query = query.eq('is_organic', true)
      }
      if (currentProduct.is_vegan) {
        query = query.eq('is_vegan', true)
      }
      if (currentProduct.is_vegetarian) {
        query = query.eq('is_vegetarian', true)
      }
      if (currentProduct.is_gluten_free) {
        query = query.eq('is_gluten_free', true)
      }

      const { data: youMightLikeProducts } = await query
        .order('is_featured', { ascending: false })
        .order('avg_rating', { ascending: false, nullsFirst: false })
        .limit(limit)

      // If not enough products with matching dietary preferences, get popular products
      if (!youMightLikeProducts || youMightLikeProducts.length < limit) {
        const existingIds = (youMightLikeProducts || []).map(p => p.id)
        existingIds.push(id)

        const { data: popularProducts } = await supabaseAdmin
          .from('products')
          .select(`
            id,
            name,
            slug,
            price_pence,
            compare_at_price_pence,
            image_url,
            short_description,
            unit,
            unit_value,
            is_organic,
            is_vegan,
            is_vegetarian,
            is_gluten_free,
            is_featured,
            has_offer,
            offer_badge,
            avg_rating,
            review_count,
            stock_quantity,
            track_inventory,
            allow_backorder,
            low_stock_threshold,
            brand,
            vendor:vendors(
              id,
              business_name,
              slug,
              is_verified
            )
          `)
          .eq('is_active', true)
          .not('id', 'in', `(${existingIds.join(',')})`)
          .order('is_featured', { ascending: false })
          .order('avg_rating', { ascending: false, nullsFirst: false })
          .limit(limit - (youMightLikeProducts?.length || 0))

        recommendations.youMightLike = [
          ...(youMightLikeProducts || []),
          ...(popularProducts || [])
        ]
      } else {
        recommendations.youMightLike = youMightLikeProducts
      }
    }

    // Return based on type
    if (type === 'similar') {
      return NextResponse.json({ products: recommendations.similar })
    }
    if (type === 'frequent') {
      return NextResponse.json({ products: recommendations.frequentlyBoughtTogether })
    }
    if (type === 'youMightLike') {
      return NextResponse.json({ products: recommendations.youMightLike })
    }

    // Return all recommendations
    return NextResponse.json({
      similar: recommendations.similar,
      frequentlyBoughtTogether: recommendations.frequentlyBoughtTogether,
      youMightLike: recommendations.youMightLike,
      currentProduct: {
        id: currentProduct.id,
        name: currentProduct.name,
        category_ids: categoryIds
      }
    })
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
