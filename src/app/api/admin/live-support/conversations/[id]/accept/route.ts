import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// Accept a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = getSupabaseAdmin()
    const user = auth.user!
    const profile = auth.profile!

    // Check current status to prevent double-accept
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('status, assigned_agent_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.status === 'active' && conversation.assigned_agent_id) {
      return NextResponse.json({ error: 'Conversation already accepted' }, { status: 409 })
    }

    if (conversation.status === 'closed' || conversation.status === 'resolved') {
      return NextResponse.json({ error: 'Conversation is already closed' }, { status: 400 })
    }

    // Update conversation status
    const { error: updateError } = await supabase
      .from('chat_conversations')
      .update({
        status: 'active',
        assigned_agent_id: user.id,
        unread_agent: 0
      })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error accepting conversation:', updateError)
      return NextResponse.json({ error: 'Failed to accept conversation' }, { status: 500 })
    }

    // Add system message
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'system',
        content: `${profile.full_name || 'Support agent'} has joined the conversation.`
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accept conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
