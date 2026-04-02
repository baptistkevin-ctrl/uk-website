import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:live-support:messages' })

export const dynamic = 'force-dynamic'

// Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin/agent access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin', 'vendor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const since = searchParams.get('since')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: messages, error } = await query

    if (error) {
      log.error('Error fetching messages', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Mark messages as read by agent
    await supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_type', 'agent')

    // Reset unread count for agent
    await supabase
      .from('chat_conversations')
      .update({ unread_agent: 0 })
      .eq('id', conversationId)

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    log.error('Get messages error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send a message as agent
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { conversation_id, content } = body

    if (!conversation_id || !content) {
      return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 })
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_type: 'agent',
        sender_id: user.id,
        sender_name: profile.full_name || 'Support Agent',
        content,
        message_type: 'text'
      })
      .select()
      .single()

    if (insertError) {
      log.error('Error sending message', { error: insertError instanceof Error ? insertError.message : String(insertError) })
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update conversation
    await supabase
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_customer: 1
      })
      .eq('id', conversation_id)

    return NextResponse.json({ message })
  } catch (error) {
    log.error('Send message error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
