import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get messages for a vendor conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const since = searchParams.get('since')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Verify conversation belongs to this vendor
    const { data: conversation } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, vendor_id, channel_type')
      .eq('id', conversationId)
      .eq('vendor_id', vendor.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
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
      console.error('Error fetching vendor messages:', error)
      return NextResponse.json({ messages: [] })
    }

    // Mark messages as read by vendor
    await supabaseAdmin
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_type', 'vendor')
      .neq('sender_type', 'agent')

    // Reset unread count for agent/vendor side
    await supabaseAdmin
      .from('chat_conversations')
      .update({ unread_agent: 0 })
      .eq('id', conversationId)

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Vendor messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send message as vendor
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor info
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })
    }

    const body = await request.json()
    const { conversation_id, content } = body

    if (!conversation_id || !content) {
      return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 })
    }

    // Verify conversation belongs to this vendor
    const { data: conversation } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, vendor_id, channel_type, unread_customer, unread_agent')
      .eq('id', conversation_id)
      .eq('vendor_id', vendor.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Determine sender type based on channel
    const senderType = conversation.channel_type === 'customer_vendor' ? 'vendor' : 'customer'
    const senderName = conversation.channel_type === 'customer_vendor'
      ? vendor.business_name
      : vendor.business_name // In vendor_admin, vendor is the requester

    const { data: message, error: insertError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_type: senderType,
        sender_id: user.id,
        sender_name: senderName,
        content,
        message_type: 'text'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error sending vendor message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update conversation
    await supabaseAdmin
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_customer: conversation.channel_type === 'customer_vendor'
          ? (conversation.unread_customer || 0) + 1
          : conversation.unread_customer || 0,
        unread_agent: conversation.channel_type === 'vendor_admin'
          ? (conversation.unread_agent || 0) + 1
          : conversation.unread_agent || 0
      })
      .eq('id', conversation_id)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Vendor send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
