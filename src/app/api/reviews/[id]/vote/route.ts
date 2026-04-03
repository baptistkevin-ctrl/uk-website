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

// POST - Vote on a review (helpful/not helpful)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to vote' }, { status: 401 })
  }

  const body = await request.json()
  const { is_helpful } = body

  if (typeof is_helpful !== 'boolean') {
    return NextResponse.json({ error: 'is_helpful must be a boolean' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Check if review exists
  const { data: review } = await supabaseAdmin
    .from('product_reviews')
    .select('id, user_id')
    .eq('id', reviewId)
    .single()

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  // Users can't vote on their own reviews
  if (review.user_id === user.id) {
    return NextResponse.json({ error: 'You cannot vote on your own review' }, { status: 400 })
  }

  // Check for existing vote
  const { data: existingVote } = await supabaseAdmin
    .from('review_votes')
    .select('id, is_helpful')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .single()

  if (existingVote) {
    if (existingVote.is_helpful === is_helpful) {
      // Remove vote if clicking the same option
      await supabaseAdmin
        .from('review_votes')
        .delete()
        .eq('id', existingVote.id)

      return NextResponse.json({ message: 'Vote removed' })
    } else {
      // Update vote if clicking different option
      await supabaseAdmin
        .from('review_votes')
        .update({ is_helpful })
        .eq('id', existingVote.id)

      return NextResponse.json({ message: 'Vote updated' })
    }
  }

  // Create new vote
  const { error } = await supabaseAdmin
    .from('review_votes')
    .insert({
      review_id: reviewId,
      user_id: user.id,
      is_helpful,
    })

  if (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Vote submitted' })
}
