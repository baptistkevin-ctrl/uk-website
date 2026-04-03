import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get all intents with training phrases
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

    // Get intents with training phrases
    const { data: intents, error } = await supabase
      .from('chatbot_intents')
      .select(`
        *,
        training_phrases:chatbot_training_phrases(id, phrase, created_at),
        responses:chatbot_responses(id, response_text, response_type, quick_replies, card_data)
      `)
      .order('intent_name')

    if (error) {
      // Table may not exist yet
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ intents: [] })
      }
      console.error('Error fetching intents:', error)
      return NextResponse.json({ error: 'Failed to fetch intents' }, { status: 500 })
    }

    // Flatten responses to main intent
    const formattedIntents = intents?.map(intent => {
      const response = intent.responses?.[0] || {}
      return {
        id: intent.id,
        intent_name: intent.intent_name,
        description: intent.description,
        response_text: response.response_text || '',
        response_type: response.response_type || 'text',
        quick_replies: response.quick_replies || [],
        is_active: intent.is_active,
        training_phrases: intent.training_phrases || []
      }
    }) || []

    return NextResponse.json({ intents: formattedIntents })
  } catch (error) {
    console.error('Get intents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new intent
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
    const { intent_name, description, response_text, response_type, quick_replies, training_phrases } = body

    // Create intent
    const { data: intent, error: intentError } = await supabase
      .from('chatbot_intents')
      .insert({
        intent_name,
        description,
        is_active: true
      })
      .select()
      .single()

    if (intentError) {
      console.error('Error creating intent:', intentError)
      return NextResponse.json({ error: 'Failed to create intent' }, { status: 500 })
    }

    // Create response
    if (response_text) {
      await supabase
        .from('chatbot_responses')
        .insert({
          intent_id: intent.id,
          response_text,
          response_type: response_type || 'text',
          quick_replies: quick_replies || []
        })
    }

    // Create training phrases
    if (training_phrases && training_phrases.length > 0) {
      await supabase
        .from('chatbot_training_phrases')
        .insert(training_phrases.map((phrase: string) => ({
          intent_id: intent.id,
          phrase
        })))
    }

    return NextResponse.json({ intent })
  } catch (error) {
    console.error('Create intent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
