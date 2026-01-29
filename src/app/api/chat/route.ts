import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get user's active conversation or check availability
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const conversationId = searchParams.get('conversation_id')
    const sessionId = searchParams.get('session_id')

    // Check availability
    if (action === 'availability') {
      const { data, error } = await supabase
        .rpc('check_chat_availability')

      if (error) {
        // Fallback
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
      const { data: conversation, error } = await supabase
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
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Mark messages as read
      if (user) {
        await supabase
          .from('chat_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('sender_type', 'agent')
          .eq('is_read', false)

        await supabase
          .from('chat_conversations')
          .update({ unread_customer: 0 })
          .eq('id', conversationId)
      }

      return NextResponse.json({ conversation })
    }

    // Get user's active conversation
    let query = supabase
      .from('chat_conversations')
      .select('*')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (user) {
      query = query.eq('user_id', user.id)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    } else {
      return NextResponse.json({ conversation: null })
    }

    const { data: conversations, error } = await query

    return NextResponse.json({
      conversation: conversations?.[0] || null
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Start a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const {
      session_id,
      guest_name,
      guest_email,
      subject,
      department,
      initial_message,
      metadata
    } = body

    // Get user info from headers for metadata
    const userAgent = request.headers.get('user-agent')
    const referrer = request.headers.get('referer')

    const fullMetadata = {
      ...metadata,
      user_agent: userAgent,
      referrer,
      started_from: metadata?.page || referrer
    }

    // Use RPC function to start conversation
    const { data, error } = await supabase
      .rpc('start_chat_conversation', {
        p_user_id: user?.id || null,
        p_session_id: session_id || null,
        p_guest_name: guest_name || null,
        p_guest_email: guest_email || null,
        p_subject: subject || null,
        p_department: department || 'general',
        p_initial_message: initial_message || null,
        p_metadata: fullMetadata
      })

    if (error) {
      console.error('Error starting conversation:', error)

      // Fallback: direct insert
      const { data: conversation, error: insertError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user?.id || null,
          session_id: session_id || null,
          guest_name,
          guest_email,
          subject,
          department: department || 'general',
          metadata: fullMetadata,
          status: 'waiting'
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 })
      }

      // Add initial message
      if (initial_message) {
        await supabase
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
      await supabase
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

    const body = await request.json()
    const { conversation_id, action, rating, feedback } = body

    if (!conversation_id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    if (action === 'close' || action === 'resolve') {
      const { data, error } = await supabase
        .rpc('close_chat_conversation', {
          p_conversation_id: conversation_id,
          p_status: action === 'resolve' ? 'resolved' : 'closed',
          p_rating: rating || null,
          p_feedback: feedback || null
        })

      if (error) {
        console.error('Error closing conversation:', error)
        return NextResponse.json({ error: 'Failed to close conversation' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'rate') {
      const { error } = await supabase
        .from('chat_conversations')
        .update({
          rating,
          feedback
        })
        .eq('id', conversation_id)

      if (error) {
        return NextResponse.json({ error: 'Failed to rate conversation' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Update chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
