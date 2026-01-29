import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { sanitizeText, sanitizeBasicHtml, sanitizeUrl, checkRateLimit, rateLimitConfigs, addRateLimitHeaders } from '@/lib/security'
import { reviewCreateSchema, validateData, formatZodErrors } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
}

// GET - Get reviews for a product
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get('product_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const sortBy = searchParams.get('sort') || 'recent' // recent, helpful, rating_high, rating_low

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const offset = (page - 1) * limit

  // Build order clause
  let orderColumn = 'created_at'
  let orderAscending = false

  switch (sortBy) {
    case 'helpful':
      orderColumn = 'helpful_count'
      orderAscending = false
      break
    case 'rating_high':
      orderColumn = 'rating'
      orderAscending = false
      break
    case 'rating_low':
      orderColumn = 'rating'
      orderAscending = true
      break
    default:
      orderColumn = 'created_at'
      orderAscending = false
  }

  // Get approved reviews with user info
  const { data: reviews, error, count } = await supabaseAdmin
    .from('product_reviews')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `, { count: 'exact' })
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order(orderColumn, { ascending: orderAscending })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  // Get rating breakdown
  const { data: ratingBreakdown } = await supabaseAdmin
    .from('product_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved')

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratingBreakdown?.forEach((r: { rating: number }) => {
    breakdown[r.rating as keyof typeof breakdown]++
  })

  return NextResponse.json({
    reviews,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    breakdown,
  })
}

// POST - Submit a new review
export async function POST(request: NextRequest) {
  // Rate limiting for reviews
  const rateLimit = checkRateLimit(request, rateLimitConfigs.review)
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: 'Too many review submissions. Please wait before trying again.' },
      { status: 429 }
    )
    return addRateLimitHeaders(response, rateLimit)
  }

  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to leave a review' }, { status: 401 })
  }

  const body = await request.json()

  // Validate input using Zod schema
  const validation = validateData(reviewCreateSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodErrors(validation.errors) },
      { status: 400 }
    )
  }

  const { product_id, rating, title, content, images } = validation.data

  // Sanitize user input to prevent XSS
  const sanitizedTitle = title ? sanitizeText(title) : null
  const sanitizedContent = content ? sanitizeBasicHtml(content) : null
  const sanitizedImages = images?.map((url: string) => sanitizeUrl(url)).filter(Boolean) || []

  const supabaseAdmin = getSupabaseAdmin()

  // Check if user already reviewed this product
  const { data: existingReview } = await supabaseAdmin
    .from('product_reviews')
    .select('id')
    .eq('product_id', product_id)
    .eq('user_id', user.id)
    .single()

  if (existingReview) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 })
  }

  // Check if user has purchased this product
  const { data: purchase } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_items!inner (product_id)
    `)
    .eq('user_id', user.id)
    .eq('payment_status', 'paid')
    .eq('order_items.product_id', product_id)
    .limit(1)
    .single()

  const isVerifiedPurchase = !!purchase

  // Create the review with sanitized content
  const { data: review, error } = await supabaseAdmin
    .from('product_reviews')
    .insert({
      product_id,
      user_id: user.id,
      order_id: purchase?.id || null,
      rating,
      title: sanitizedTitle,
      content: sanitizedContent,
      images: sanitizedImages,
      is_verified_purchase: isVerifiedPurchase,
      status: 'pending', // Reviews go through moderation
    })
    .select()
    .single()

  if (error) {
    console.error('Review creation error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }

  return NextResponse.json({
    review,
    message: 'Your review has been submitted and is pending approval',
  })
}
