import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Post an answer to a question
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: questionId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { answer } = body

    if (!answer || answer.trim().length < 5) {
      return NextResponse.json(
        { error: 'Answer must be at least 5 characters' },
        { status: 400 }
      )
    }

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Must be logged in to answer' }, { status: 401 })
    }

    // Check if question exists and is approved
    const { data: question } = await supabase
      .from('product_questions')
      .select('id, product_id, status')
      .eq('id', questionId)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if user is vendor for this product
    const { data: product } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', question.product_id)
      .single()

    let isOfficial = false
    let vendorId = null

    if (product?.vendor_id) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', product.vendor_id)
        .eq('user_id', user.id)
        .single()

      if (vendor) {
        isOfficial = true
        vendorId = vendor.id
      }
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      isOfficial = true
    }

    // Create answer
    const { data: newAnswer, error } = await supabase
      .from('product_answers')
      .insert({
        question_id: questionId,
        user_id: user.id,
        vendor_id: vendorId,
        is_official: isOfficial,
        answer: answer.trim()
      })
      .select(`
        *,
        user:profiles(id, full_name, avatar_url),
        vendor:vendors(id, business_name, logo_url)
      `)
      .single()

    if (error) {
      console.error('Error creating answer:', error)
      return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
    }

    // Update question status to answered
    await supabase
      .from('product_questions')
      .update({ status: 'answered', updated_at: new Date().toISOString() })
      .eq('id', questionId)

    return NextResponse.json({ answer: newAnswer })
  } catch (error) {
    console.error('Post answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
