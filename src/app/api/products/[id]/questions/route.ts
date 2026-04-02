import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:products:questions' })

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Get questions for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get questions with answers
    const { data: questions, error, count } = await supabase
      .from('product_questions')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url),
        answers:product_answers(
          *,
          user:profiles(id, full_name, avatar_url),
          vendor:vendors(id, business_name, logo_url)
        )
      `, { count: 'exact' })
      .eq('product_id', id)
      .in('status', ['approved', 'answered'])
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      log.error('Error fetching questions', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({
      questions: questions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    log.error('Get questions error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Post a new question
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { question, guest_name, guest_email } = body

    if (!question || question.trim().length < 10) {
      return NextResponse.json(
        { error: 'Question must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Create question
    const { data: newQuestion, error } = await supabase
      .from('product_questions')
      .insert({
        product_id: id,
        user_id: user?.id || null,
        guest_name: !user ? guest_name : null,
        guest_email: !user ? guest_email : null,
        question: question.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      log.error('Error creating question', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 })
    }

    return NextResponse.json({
      question: newQuestion,
      message: 'Your question has been submitted and will appear once approved.'
    })
  } catch (error) {
    log.error('Post question error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
