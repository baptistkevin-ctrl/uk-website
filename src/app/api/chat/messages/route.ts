import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const since = searchParams.get('since')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    let query = supabaseAdmin
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
      console.error('Error fetching messages:', error)
      return NextResponse.json({ messages: [] })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Chat messages API error:', error)
    return NextResponse.json({ messages: [] })
  }
}

// Send a message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const supabaseAdmin = getSupabaseAdmin()

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

    // Get conversation
    const { data: conversation, error: convError } = await supabaseAdmin
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
      const { data: profile } = await supabaseAdmin
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

    // Insert message directly (bypass RPC in case it doesn't exist)
    const { data: message, error: insertError } = await supabaseAdmin
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
      console.error('Error sending message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update conversation timestamp
    await supabaseAdmin
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_customer: senderType === 'agent'
          ? (conversation.unread_customer || 0) + 1
          : conversation.unread_customer || 0,
        unread_agent: senderType === 'customer'
          ? (conversation.unread_agent || 0) + 1
          : conversation.unread_agent || 0
      })
      .eq('id', conversation_id)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
