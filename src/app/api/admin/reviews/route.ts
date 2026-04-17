import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Get reviews for moderation
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'pending'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
  const offset = (page - 1) * limit

  const supabase = getSupabaseAdmin()

  const { data: reviews, error, count } = await supabase
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
  const { data: pendingCount } = await supabase
    .from('product_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { data: approvedCount } = await supabase
    .from('product_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { data: rejectedCount } = await supabase
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
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

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
      reviewed_by: auth.user!.id,
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
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

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
