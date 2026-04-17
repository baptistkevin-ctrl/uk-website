import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// Close/resolve a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { status = 'resolved' } = body

    // Validate status
    const validStatus = ['resolved', 'closed'].includes(status) ? status : 'resolved'

    // Check if already closed
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('status')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.status === 'closed' || conversation.status === 'resolved') {
      return NextResponse.json({ error: 'Conversation already closed' }, { status: 400 })
    }

    // Update conversation status
    const { error: updateError } = await supabase
      .from('chat_conversations')
      .update({
        status: validStatus,
        resolved_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error closing conversation:', updateError)
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
    console.error('Close conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
