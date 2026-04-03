import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string; phraseId: string }>
}

// Delete training phrase
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { phraseId } = await params
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

    const { error } = await supabase
      .from('chatbot_training_phrases')
      .delete()
      .eq('id', phraseId)

    if (error) {
      console.error('Error deleting phrase:', error)
      return NextResponse.json({ error: 'Failed to delete phrase' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete phrase error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
