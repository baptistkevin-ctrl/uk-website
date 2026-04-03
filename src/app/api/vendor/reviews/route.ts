import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    // Get vendor's product IDs
    const { data: vendorProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('vendor_id', vendor.id)

    const productIds = vendorProducts?.map(p => p.id) || []

    if (productIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        total: 0,
        page,
        totalPages: 0,
        stats: { average: 0, total: 0, pending: 0 }
      })
    }

    // Get reviews for vendor's products
    let query = supabaseAdmin
      .from('product_reviews')
      .select(`
        *,
        profiles:user_id (full_name, email),
        products:product_id (name, slug, image_url)
      `, { count: 'exact' })
      .in('product_id', productIds)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: reviews, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Vendor reviews error:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Get stats
    const { data: allReviews } = await supabaseAdmin
      .from('product_reviews')
      .select('rating, status')
      .in('product_id', productIds)

    const approvedReviews = allReviews?.filter(r => r.status === 'approved') || []
    const avgRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0

    return NextResponse.json({
      reviews,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      stats: {
        average: Math.round(avgRating * 10) / 10,
        total: allReviews?.length || 0,
        pending: allReviews?.filter(r => r.status === 'pending').length || 0,
      }
    })
  } catch (error) {
    console.error('Vendor reviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
