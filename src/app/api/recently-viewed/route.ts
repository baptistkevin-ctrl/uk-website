import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:recently-viewed' })

export const dynamic = 'force-dynamic'

// Get recently viewed products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // For guests, return empty - they'll use localStorage
      return NextResponse.json({ products: [], message: 'Use localStorage for guest users' })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Use RPC function to get recently viewed with product details
    const { data: products, error } = await supabase
      .rpc('get_recently_viewed_products', {
        p_user_id: user.id,
        p_limit: limit
      })

    if (error) {
      log.error('Error fetching recently viewed', { error: error instanceof Error ? error.message : String(error) })

      // Fallback to manual query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('recently_viewed')
        .select(`
          product_id,
          viewed_at,
          view_count,
          products (
            id,
            name,
            slug,
            price_pence,
            original_price_pence,
            image_url,
            avg_rating,
            review_count,
            categories (name)
          )
        `)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(limit)

      if (fallbackError) {
        return NextResponse.json({ error: 'Failed to fetch recently viewed' }, { status: 500 })
      }

      // Transform the data
      const transformedProducts = (fallbackData || []).map((item: any) => ({
        product_id: item.product_id,
        viewed_at: item.viewed_at,
        view_count: item.view_count,
        name: item.products?.name,
        slug: item.products?.slug,
        price_pence: item.products?.price_pence,
        original_price_pence: item.products?.original_price_pence,
        image_url: item.products?.image_url,
        category_name: item.products?.categories?.name,
        avg_rating: item.products?.avg_rating,
        review_count: item.products?.review_count
      }))

      return NextResponse.json({ products: transformedProducts })
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    log.error('Recently viewed API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Track a product view
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { product_id, session_id } = body

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get request headers for analytics
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null

    // Track the view using RPC function
    const { error } = await supabase.rpc('track_product_view', {
      p_product_id: product_id,
      p_user_id: user?.id || null,
      p_session_id: session_id || null,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_referrer: referrer
    })

    if (error) {
      log.error('Error tracking view', { error: error instanceof Error ? error.message : String(error) })

      // Fallback: Direct insert if RPC doesn't exist yet
      if (user) {
        const { error: insertError } = await supabase
          .from('recently_viewed')
          .upsert({
            user_id: user.id,
            product_id,
            viewed_at: new Date().toISOString(),
            view_count: 1
          }, {
            onConflict: 'user_id,product_id',
            ignoreDuplicates: false
          })

        if (insertError) {
          log.error('Fallback insert error', { error: insertError instanceof Error ? insertError.message : String(insertError) })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Track view error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Clear recently viewed
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (productId) {
      // Remove specific product
      const { error } = await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) {
        log.error('Error removing product', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to remove product' }, { status: 500 })
      }
    } else {
      // Clear all
      const { error } = await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        log.error('Error clearing recently viewed', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to clear recently viewed' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Delete recently viewed error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
