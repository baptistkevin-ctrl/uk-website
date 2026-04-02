import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:chat:messages' })

export const dynamic = 'force-dynamic'

// Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const since = searchParams.get('since') // For polling new messages
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: messages, error } = await query

    if (error) {
      log.error('Error fetching messages', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    log.error('Chat messages API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send a message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const {
      conversation_id,
      content,
      message_type = 'text',
      attachments = [],
      metadata = {}
    } = body

    if (!conversation_id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    if (!content && attachments.length === 0) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 })
    }

    // Get conversation to validate and get sender info
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Determine sender type and name
    let senderType = 'customer'
    let senderName = conversation.guest_name || 'Customer'

    if (user) {
      // Check if user is an agent
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'vendor') {
        senderType = 'agent'
        senderName = profile.full_name || 'Support Agent'
      } else {
        senderName = profile?.full_name || 'Customer'
      }
    }

    // Use RPC function to send message
    const { data: messageId, error } = await supabase
      .rpc('send_chat_message', {
        p_conversation_id: conversation_id,
        p_sender_type: senderType,
        p_sender_id: user?.id || null,
        p_sender_name: senderName,
        p_content: content,
        p_message_type: message_type,
        p_attachments: attachments,
        p_metadata: metadata
      })

    if (error) {
      log.error('Error sending message', { error: error instanceof Error ? error.message : String(error) })

      // Fallback: direct insert
      const { data: message, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id,
          sender_type: senderType,
          sender_id: user?.id || null,
          sender_name: senderName,
          content,
          message_type,
          attachments,
          metadata
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
      }

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_agent: senderType === 'customer'
            ? conversation.unread_agent + 1
            : conversation.unread_agent
        })
        .eq('id', conversation_id)

      return NextResponse.json({ message })
    }

    // Get the created message
    const { data: message } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    return NextResponse.json({ message })
  } catch (error) {
    log.error('Send message error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
