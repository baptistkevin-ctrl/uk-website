import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { apiSuccess, apiCatchAll } from '@/lib/utils/api-error'

const log = logger.child({ context: 'admin:reviews' })

export const dynamic = 'force-dynamic'

// GET - Get reviews for moderation
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

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
      log.error('Failed to fetch reviews', { error: error.message, status })
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reviews' } },
        { status: 500 }
      )
    }

    // Get counts by status
    const { count: pendingCount } = await supabaseAdmin
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: approvedCount } = await supabaseAdmin
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')

    const { count: rejectedCount } = await supabaseAdmin
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected')

    return apiSuccess(
      { reviews },
      {
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
        counts: {
          pending: pendingCount || 0,
          approved: approvedCount || 0,
          rejected: rejectedCount || 0,
        },
      }
    )
  } catch (error) {
    return apiCatchAll(error, 'admin:reviews:get')
  }
}

// PUT - Moderate a review (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const body = await request.json()
    const { review_id, status, admin_notes } = body

    if (!review_id || !status) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Review ID and status are required' } },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } },
        { status: 400 }
      )
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
      log.error('Failed to moderate review', { error: error.message, review_id, status })
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to moderate review' } },
        { status: 500 }
      )
    }

    log.info('Review moderated', { review_id, status, admin: auth.user!.id })
    return apiSuccess({ review })
  } catch (error) {
    return apiCatchAll(error, 'admin:reviews:put')
  }
}

// DELETE - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const searchParams = request.nextUrl.searchParams
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Review ID is required' } },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      log.error('Failed to delete review', { error: error.message, reviewId })
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete review' } },
        { status: 500 }
      )
    }

    log.info('Review deleted', { reviewId, admin: auth.user!.id })
    return apiSuccess({ success: true })
  } catch (error) {
    return apiCatchAll(error, 'admin:reviews:delete')
  }
}
