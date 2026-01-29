import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Update ticket (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, priority, assigned_to, tags } = body

    // Build update object
    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating ticket:', error)
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
      }
    }

    // Handle tags
    if (tags !== undefined) {
      // Remove existing tags
      await supabase
        .from('ticket_tag_assignments')
        .delete()
        .eq('ticket_id', id)

      // Add new tags
      if (tags.length > 0) {
        const tagAssignments = tags.map((tagId: string) => ({
          ticket_id: id,
          tag_id: tagId
        }))

        await supabase
          .from('ticket_tag_assignments')
          .insert(tagAssignments)
      }
    }

    // Add system message for status change
    if (status) {
      const statusMessages: Record<string, string> = {
        'open': 'Ticket reopened',
        'in_progress': 'Ticket is now being worked on',
        'awaiting_customer': 'Waiting for customer response',
        'resolved': 'Ticket has been resolved',
        'closed': 'Ticket has been closed'
      }

      if (statusMessages[status]) {
        await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: id,
            sender_id: user.id,
            sender_type: 'system',
            message: statusMessages[status]
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin update ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add internal note or reply (admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { message, is_internal, canned_response_id } = body

    let messageText = message

    // If using canned response, get the text
    if (canned_response_id) {
      const { data: cannedResponse } = await supabase
        .from('canned_responses')
        .select('content')
        .eq('id', canned_response_id)
        .single()

      if (cannedResponse) {
        messageText = cannedResponse.content
      }
    }

    if (!messageText) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Add message using function
    const { data: messageId, error } = await supabase
      .rpc('add_ticket_message', {
        p_ticket_id: id,
        p_sender_id: user.id,
        p_sender_type: 'agent',
        p_message: messageText,
        p_is_internal: is_internal || false,
        p_attachments: []
      })

    if (error) {
      console.error('Error adding message:', error)
      return NextResponse.json({ error: 'Failed to add message' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message_id: messageId
    })
  } catch (error) {
    console.error('Admin add message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
