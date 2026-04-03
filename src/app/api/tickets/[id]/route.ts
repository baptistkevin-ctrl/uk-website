import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get single ticket with messages
export async function GET(
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

    // Get ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        category:ticket_categories(id, name, slug, icon),
        order:orders(id, order_number, total_pence, status),
        assigned:assigned_to(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check ownership
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    if (ticket.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get messages
    const messagesQuery = supabase
      .from('ticket_messages')
      .select(`
        *,
        sender:sender_id(id, full_name, avatar_url, role)
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    // Non-admin users shouldn't see internal notes
    if (!isAdmin) {
      messagesQuery.eq('is_internal', false)
    }

    const { data: messages } = await messagesQuery

    // Mark as read by user
    if (ticket.user_id === user.id && !ticket.is_read_by_user) {
      await supabase
        .from('support_tickets')
        .update({ is_read_by_user: true })
        .eq('id', id)
    }

    // Mark as read by admin
    if (isAdmin && !ticket.is_read_by_admin) {
      await supabase
        .from('support_tickets')
        .update({ is_read_by_admin: true })
        .eq('id', id)
    }

    return NextResponse.json({
      ticket,
      messages: messages || [],
      isAdmin
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add message to ticket
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

    const body = await request.json()
    const { message, is_internal, attachments } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Verify ticket exists and user has access
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    const isOwner = ticket.user_id === user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Determine sender type
    const senderType = isAdmin ? 'agent' : 'customer'

    // Add message using function
    const { data: messageId, error } = await supabase
      .rpc('add_ticket_message', {
        p_ticket_id: id,
        p_sender_id: user.id,
        p_sender_type: senderType,
        p_message: message,
        p_is_internal: isAdmin ? (is_internal || false) : false,
        p_attachments: attachments || []
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
    console.error('Add message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update ticket status/priority (admin or owner for closing)
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

    const body = await request.json()
    const { status, priority, assigned_to } = body

    // Get ticket and check access
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    const isOwner = ticket.user_id === user.id

    // Build update object
    const updates: Record<string, unknown> = {}

    // Owners can only close their tickets
    if (isOwner && !isAdmin) {
      if (status && status !== 'closed') {
        return NextResponse.json({ error: 'You can only close your tickets' }, { status: 403 })
      }
      if (status === 'closed') {
        updates.status = 'closed'
      }
    }

    // Admins can update everything
    if (isAdmin) {
      if (status) updates.status = status
      if (priority) updates.priority = priority
      if (assigned_to !== undefined) updates.assigned_to = assigned_to
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating ticket:', error)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    // Add system message for status change
    if (status) {
      const statusMessages: Record<string, string> = {
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
    console.error('Update ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
