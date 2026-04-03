import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get user's active conversation or check availability
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const conversationId = searchParams.get('conversation_id')
    const sessionId = searchParams.get('session_id')
    const channelType = searchParams.get('channel_type')

    // Check availability
    if (action === 'availability') {
      const { data, error } = await supabaseAdmin
        .rpc('check_chat_availability')

      if (error) {
        return NextResponse.json({
          is_available: true,
          estimated_wait_minutes: 0,
          available_agents: 1
        })
      }

      return NextResponse.json(data?.[0] || {
        is_available: true,
        estimated_wait_minutes: 0,
        available_agents: 0
      })
    }

    // Get specific conversation
    if (conversationId) {
      const { data: conversation, error } = await supabaseAdmin
        .from('chat_conversations')
        .select(`
          *,
          chat_messages (
            id,
            sender_type,
            sender_name,
            content,
            message_type,
            attachments,
            metadata,
            is_read,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single()

      if (error) {
        console.error('Conversation lookup error:', error)
        return NextResponse.json({ conversation: null })
      }

      // Mark messages as read
      if (user) {
        await supabaseAdmin
          .from('chat_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('sender_type', 'agent')
          .eq('is_read', false)

        await supabaseAdmin
          .from('chat_conversations')
          .update({ unread_customer: 0 })
          .eq('id', conversationId)
      }

      return NextResponse.json({ conversation })
    }

    const listAll = searchParams.get('list')

    // Return ALL conversations for this user/session
    if (listAll === 'true') {
      let listQuery = supabaseAdmin
        .from('chat_conversations')
        .select('*, vendors (business_name, logo_url)')
        .order('updated_at', { ascending: false })

      if (user) {
        listQuery = listQuery.eq('user_id', user.id)
      } else if (sessionId) {
        listQuery = listQuery.eq('session_id', sessionId)
      } else {
        return NextResponse.json({ conversations: [] })
      }

      const { data: allConversations, error: listError } = await listQuery

      if (listError) {
        console.error('Chat list query error:', listError)
        return NextResponse.json({ conversations: [] })
      }

      return NextResponse.json({ conversations: allConversations || [] })
    }

    // Get user's active conversation (single)
    let query = supabaseAdmin
      .from('chat_conversations')
      .select('*')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)

    // Filter by channel type if specified
    if (channelType) {
      query = query.eq('channel_type', channelType)
    }

    if (user) {
      query = query.eq('user_id', user.id)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    } else {
      return NextResponse.json({ conversation: null })
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error('Chat query error:', error)
      return NextResponse.json({ conversation: null })
    }

    return NextResponse.json({
      conversation: conversations?.[0] || null
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ conversation: null })
  }
}

// Start a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    const {
      session_id,
      guest_name,
      guest_email,
      subject,
      department,
      initial_message,
      metadata,
      channel_type = 'customer_admin',
      vendor_id = null
    } = body

    const userAgent = request.headers.get('user-agent')
    const referrer = request.headers.get('referer')

    const fullMetadata = {
      ...metadata,
      user_agent: userAgent,
      referrer,
      started_from: metadata?.page || referrer
    }

    // Try RPC function first
    const { data, error } = await supabaseAdmin
      .rpc('start_chat_conversation', {
        p_user_id: user?.id || null,
        p_session_id: session_id || null,
        p_guest_name: guest_name || null,
        p_guest_email: guest_email || null,
        p_subject: subject || null,
        p_department: department || 'general',
        p_initial_message: initial_message || null,
        p_metadata: fullMetadata,
        p_channel_type: channel_type,
        p_vendor_id: vendor_id
      })

    if (error) {
      console.error('RPC start_chat error:', error)

      // Fallback: direct insert
      const { data: conversation, error: insertError } = await supabaseAdmin
        .from('chat_conversations')
        .insert({
          user_id: user?.id || null,
          session_id: session_id || null,
          guest_name,
          guest_email,
          subject,
          department: department || 'general',
          metadata: fullMetadata,
          status: 'waiting',
          channel_type,
          vendor_id
        })
        .select()
        .single()

      if (insertError) {
        console.error('Fallback insert error:', insertError)
        return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 })
      }

      // Add initial message
      if (initial_message) {
        await supabaseAdmin
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            sender_type: 'customer',
            sender_id: user?.id || null,
            sender_name: guest_name || 'Customer',
            content: initial_message
          })
      }

      // Add system message
      await supabaseAdmin
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'system',
          content: 'Thank you for contacting us. You\'ll be connected to the next available agent shortly.'
        })

      return NextResponse.json({
        conversation_id: conversation.id,
        status: conversation.status
      })
    }

    const result = data?.[0]
    return NextResponse.json({
      conversation_id: result?.conversation_id,
      message_id: result?.message_id
    })
  } catch (error) {
    console.error('Start chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update conversation (rate, close)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    const { conversation_id, action, rating, feedback } = body

    if (!conversation_id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    if (action === 'close' || action === 'resolve') {
      const { error } = await supabaseAdmin
        .rpc('close_chat_conversation', {
          p_conversation_id: conversation_id,
          p_status: action === 'resolve' ? 'resolved' : 'closed',
          p_rating: rating || null,
          p_feedback: feedback || null
        })

      if (error) {
        // Fallback: direct update
        await supabaseAdmin
          .from('chat_conversations')
          .update({
            status: action === 'resolve' ? 'resolved' : 'closed',
            rating: rating || null,
            feedback: feedback || null,
            closed_at: new Date().toISOString()
          })
          .eq('id', conversation_id)
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'rate') {
      await supabaseAdmin
        .from('chat_conversations')
        .update({ rating, feedback })
        .eq('id', conversation_id)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Update chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
