import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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

async function isAdmin() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

// GET - Get reviews for moderation
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'pending'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const supabaseAdmin = getSupabaseAdmin()

  const { data: reviews, error, count } = await supabaseAdmin
    .from('product_reviews')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      ),
      products:product_id (
        name,
        slug,
        image_url
      )
    `, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Admin reviews fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  // Get counts by status
  const { data: pendingCount } = await supabaseAdmin
    .from('product_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { data: approvedCount } = await supabaseAdmin
    .from('product_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { data: rejectedCount } = await supabaseAdmin
    .from('product_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'rejected')

  return NextResponse.json({
    reviews,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    counts: {
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
    },
  })
}

// PUT - Moderate a review (approve/reject)
export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const { review_id, status, admin_notes } = body

  if (!review_id || !status) {
    return NextResponse.json({ error: 'Review ID and status are required' }, { status: 400 })
  }

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: review, error } = await supabaseAdmin
    .from('product_reviews')
    .update({
      status,
      admin_notes: admin_notes || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', review_id)
    .select()
    .single()

  if (error) {
    console.error('Review moderation error:', error)
    return NextResponse.json({ error: 'Failed to moderate review' }, { status: 500 })
  }

  return NextResponse.json({ review })
}

// DELETE - Delete a review
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const reviewId = searchParams.get('id')

  if (!reviewId) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('product_reviews')
    .delete()
    .eq('id', reviewId)

  if (error) {
    console.error('Review deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
