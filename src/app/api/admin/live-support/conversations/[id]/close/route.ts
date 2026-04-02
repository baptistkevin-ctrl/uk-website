import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:live-support:conversations:close' })

export const dynamic = 'force-dynamic'

// Close/resolve a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { status = 'resolved' } = body

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
        status,
        resolved_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (updateError) {
      log.error('Error closing conversation', { error: updateError instanceof Error ? updateError.message : String(updateError) })
      return NextResponse.json({ error: 'Failed to close conversation' }, { status: 500 })
    }

    // Add system message
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'system',
        content: status === 'resolved'
          ? 'This conversation has been resolved. Thank you for contacting us!'
          : 'This conversation has been closed.'
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Close conversation error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
