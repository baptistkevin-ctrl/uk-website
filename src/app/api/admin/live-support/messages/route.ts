import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { sanitizeText } from '@/lib/security'

export const dynamic = 'force-dynamic'

// Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const since = searchParams.get('since')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: messages, error } = await query

    if (error) {
      // Table may not exist yet
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ messages: [] })
      }
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Only mark as read on initial load (not during polling)
    if (!since) {
      try {
        await supabaseAdmin
          .from('chat_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('is_read', false)
          .neq('sender_type', 'agent')

        await supabaseAdmin
          .from('chat_conversations')
          .update({ unread_agent: 0 })
          .eq('id', conversationId)
      } catch {
        // Non-critical — don't fail if mark-as-read fails
      }
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ messages: [] })
  }
}

// Send a message as agent
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabaseAdmin = getSupabaseAdmin()
    const user = auth.user!
    const profile = auth.profile!

    const body = await request.json()
    const { conversation_id, content } = body

    if (!conversation_id || !content) {
      return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
    }

    // Verify conversation exists and get current unread count
    const { data: conversation } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, unread_customer')
      .eq('id', conversation_id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Insert message
    const { data: message, error: insertError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_type: 'agent',
        sender_id: user.id,
        sender_name: sanitizeText(profile.full_name || 'Support Agent'),
        content: sanitizeText(content),
        message_type: 'text'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error sending message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update conversation - increment unread counter
    await supabaseAdmin
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_customer: (conversation.unread_customer || 0) + 1
      })
      .eq('id', conversation_id)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
