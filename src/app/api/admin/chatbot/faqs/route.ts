import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get all FAQs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: faqs, error } = await supabaseAdmin
      .from('chatbot_faqs')
      .select('*')
      .order('category')
      .order('sort_order')

    if (error) {
      console.error('Error fetching FAQs:', error)
      return NextResponse.json({ faqs: [] })
    }

    return NextResponse.json({ faqs: faqs || [] })
  } catch (error) {
    console.error('Get FAQs error:', error)
    return NextResponse.json({ faqs: [] })
  }
}

// Create new FAQ
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { question, answer, category, keywords } = body

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    }

    const { data: faq, error } = await supabaseAdmin
      .from('chatbot_faqs')
      .insert({
        question,
        answer,
        category: category || 'General',
        keywords: keywords || [],
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 })
    }

    return NextResponse.json({ faq })
  } catch (error) {
    console.error('Create FAQ error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
