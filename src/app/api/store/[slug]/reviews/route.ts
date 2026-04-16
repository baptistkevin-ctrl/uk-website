import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET store reviews
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single()

    if (!vendor) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = 10
    const offset = (page - 1) * limit

    const { data: reviews, count, error } = await supabaseAdmin
      .from('vendor_reviews')
      .select('*, profiles:user_id(full_name, avatar_url)', { count: 'exact' })
      .eq('vendor_id', vendor.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ reviews: [], total: 0, avgRating: 0 })
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Calculate average rating
    const { data: allRatings } = await supabaseAdmin
      .from('vendor_reviews')
      .select('rating')
      .eq('vendor_id', vendor.id)
      .eq('status', 'approved')

    const avgRating = allRatings && allRatings.length > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
      : 0

    return NextResponse.json({
      reviews: reviews || [],
      total: count || 0,
      avgRating,
      totalReviews: allRatings?.length || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Store reviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST — submit a store review
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Please sign in to leave a review' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, business_name, email')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single()

    if (!vendor) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const body = await request.json()
    const { rating, title, content } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Check if user already reviewed this vendor
    const { data: existing } = await supabaseAdmin
      .from('vendor_reviews')
      .select('id')
      .eq('vendor_id', vendor.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this store' }, { status: 400 })
    }

    // Check if user has ordered from this vendor
    const { data: hasOrdered } = await supabaseAdmin
      .from('vendor_orders')
      .select('id')
      .eq('vendor_id', vendor.id)
      .limit(1)

    const { data: review, error } = await supabaseAdmin
      .from('vendor_reviews')
      .insert({
        vendor_id: vendor.id,
        user_id: user.id,
        rating,
        title: title?.trim() || null,
        content: content?.trim() || null,
        is_verified_purchase: !!hasOrdered && hasOrdered.length > 0,
        status: 'approved', // Auto-approve for now
      })
      .select()
      .single()

    if (error) {
      console.error('Store review creation error:', error)
      return NextResponse.json({ error: `Failed to submit review: ${error.message}` }, { status: 500 })
    }

    // Update vendor's average rating
    const { data: allRatings } = await supabaseAdmin
      .from('vendor_reviews')
      .select('rating')
      .eq('vendor_id', vendor.id)
      .eq('status', 'approved')

    if (allRatings && allRatings.length > 0) {
      const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      await supabaseAdmin
        .from('vendors')
        .update({
          rating: Math.round(avg * 10) / 10,
          review_count: allRatings.length,
        })
        .eq('id', vendor.id)
    }

    // Notify vendor
    try {
      const { sendEmail } = await import('@/lib/email/send-email')
      if (vendor.email) {
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
        await sendEmail({
          to: vendor.email,
          subject: `New ${rating}-Star Store Review`,
          html: `<h2>New Store Review</h2><p>A customer left a <strong>${stars}</strong> review for your store <strong>${vendor.business_name}</strong>.</p>${title ? `<p><strong>"${title}"</strong></p>` : ''}${content ? `<p style="color:#666;">${content}</p>` : ''}<p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://uk-grocery-store.com'}/vendor/reviews">View in Dashboard</a></p>`,
        })
      }
    } catch { /* non-critical */ }

    return NextResponse.json({ review, message: 'Review submitted successfully' }, { status: 201 })
  } catch (error) {
    console.error('Store review error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
