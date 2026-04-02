import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:live-support:conversations:accept' })

export const dynamic = 'force-dynamic'

// Accept a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()

    // Verify admin/agent access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin', 'vendor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
      log.error('Error accepting conversation', { error: updateError instanceof Error ? updateError.message : String(updateError) })
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
    log.error('Accept conversation error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
