import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Update intent
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { error } = await supabase
      .from('chatbot_intents')
      .update(body)
      .eq('id', id)

    if (error) {
      console.error('Error updating intent:', error)
      return NextResponse.json({ error: 'Failed to update intent' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update intent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete intent
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Delete associated training phrases and responses first
    await supabase
      .from('chatbot_training_phrases')
      .delete()
      .eq('intent_id', id)

    await supabase
      .from('chatbot_responses')
      .delete()
      .eq('intent_id', id)

    const { error } = await supabase
      .from('chatbot_intents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting intent:', error)
      return NextResponse.json({ error: 'Failed to delete intent' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete intent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
