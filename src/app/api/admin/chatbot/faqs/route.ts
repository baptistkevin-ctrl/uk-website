import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:chatbot:faqs' })

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: faqs, error } = await supabase
      .from('chatbot_faqs')
      .select('*')
      .order('category')
      .order('order_index')

    if (error) {
      log.error('Error fetching FAQs', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
    }

    return NextResponse.json({ faqs: faqs || [] })
  } catch (error) {
    log.error('Get FAQs error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const { data: profile } = await supabase
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

    const { data: faq, error } = await supabase
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
      log.error('Error creating FAQ', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 })
    }

    return NextResponse.json({ faq })
  } catch (error) {
    log.error('Create FAQ error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
