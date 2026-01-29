import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Add training phrase to intent
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
    const { phrase } = body

    if (!phrase) {
      return NextResponse.json({ error: 'Phrase is required' }, { status: 400 })
    }

    const { data: newPhrase, error } = await supabase
      .from('chatbot_training_phrases')
      .insert({
        intent_id: id,
        phrase
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding phrase:', error)
      return NextResponse.json({ error: 'Failed to add phrase' }, { status: 500 })
    }

    return NextResponse.json({ phrase: newPhrase })
  } catch (error) {
    console.error('Add phrase error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
