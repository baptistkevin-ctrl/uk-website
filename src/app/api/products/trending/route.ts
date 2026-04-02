import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:products:trending' })

export const dynamic = 'force-dynamic'

// Get trending products based on recent views
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const hours = parseInt(searchParams.get('hours') || '24')

    // Try using the RPC function first
    const { data: trendingProducts, error } = await supabase
      .rpc('get_trending_products', {
        p_limit: limit,
        p_hours: hours
      })

    if (error) {
      log.error('Error fetching trending (RPC)', { error: error instanceof Error ? error.message : String(error) })

      // Fallback: Get products ordered by view count or rating
      const { data: fallbackProducts, error: fallbackError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price_pence,
          original_price_pence,
          image_url,
          avg_rating,
          review_count,
          categories (name)
        `)
        .eq('is_active', true)
        .order('review_count', { ascending: false, nullsFirst: false })
        .order('avg_rating', { ascending: false, nullsFirst: false })
        .limit(limit)

      if (fallbackError) {
        log.error('Fallback error', { error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) })
        return NextResponse.json({ error: 'Failed to fetch trending products' }, { status: 500 })
      }

      const transformedProducts = (fallbackProducts || []).map((p: any) => ({
        product_id: p.id,
        name: p.name,
        slug: p.slug,
        price_pence: p.price_pence,
        original_price_pence: p.original_price_pence,
        image_url: p.image_url,
        avg_rating: p.avg_rating,
        review_count: p.review_count,
        category_name: p.categories?.name,
        view_count: p.review_count || 0,
        unique_viewers: 0
      }))

      return NextResponse.json({ products: transformedProducts })
    }

    return NextResponse.json({ products: trendingProducts || [] })
  } catch (error) {
    log.error('Trending products API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
