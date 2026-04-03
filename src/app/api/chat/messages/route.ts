import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/security'

export const dynamic = 'force-dynamic'

// Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const sessionId = searchParams.get('session_id')
    const since = searchParams.get('since')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50') || 50, 100)

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Require either an authenticated user or a session_id
    if (!user && !sessionId) {
      return NextResponse.json({ error: 'Authentication or session ID required' }, { status: 401 })
    }

    // Verify the conversation belongs to this user/session
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, user_id, session_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check ownership: user must match user_id, or session must match session_id
    const isOwner = (user && conversation.user_id === user.id) ||
      (sessionId && conversation.session_id === sessionId)

    if (!isOwner) {
      // Also allow admins/agents to read messages
      let isAdmin = false
      if (user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'vendor'
      }
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
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

    if (content && content.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
    }

    if (attachments.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 attachments allowed' }, { status: 400 })
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

    // Verify ownership: user_id, session_id, or admin/vendor role
    const isOwner = (user && conversation.user_id === user.id) ||
      (!user && conversation.session_id && body.session_id === conversation.session_id)

    if (!isOwner && user) {
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const isPrivileged = senderProfile?.role === 'admin' || senderProfile?.role === 'super_admin' || senderProfile?.role === 'vendor'
      if (!isPrivileged) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (!isOwner && !user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Determine sender type and name based on role and channel
    let senderType = 'customer'
    let senderName = conversation.guest_name || 'Customer'

    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'vendor') {
        if (conversation.channel_type === 'customer_vendor') {
          // Vendor replying to customer — sender is 'vendor'
          senderType = 'vendor'
          // Get vendor business name
          const { data: vendor } = await supabaseAdmin
            .from('vendors')
            .select('business_name')
            .eq('user_id', user.id)
            .single()
          senderName = vendor?.business_name || profile.full_name || 'Vendor'
        } else if (conversation.channel_type === 'vendor_admin') {
          // Vendor chatting with admin — vendor is the 'customer' side
          senderType = 'customer'
          senderName = profile.full_name || 'Vendor'
        } else {
          // Vendor acting as agent on customer_admin chats
          senderType = 'agent'
          senderName = profile.full_name || 'Support Agent'
        }
      } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
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
        sender_name: sanitizeText(senderName),
        content: sanitizeText(content),
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

    // Update conversation timestamp and unread counters
    // vendor messages in customer_vendor should increment unread_customer
    const incrementCustomerUnread = senderType === 'agent' || senderType === 'vendor'
    const incrementAgentUnread = senderType === 'customer'
    await supabaseAdmin
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_customer: incrementCustomerUnread
          ? (conversation.unread_customer || 0) + 1
          : conversation.unread_customer || 0,
        unread_agent: incrementAgentUnread
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
