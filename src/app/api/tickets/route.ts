import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get user's tickets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10))
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        category:ticket_categories(id, name, slug, icon),
        messages:ticket_messages(count)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.in('status', ['open', 'in_progress', 'awaiting_customer'])
      } else {
        query = query.eq('status', status)
      }
    }

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Get ticket stats
    const { data: stats } = await supabase
      .rpc('get_user_ticket_stats', { p_user_id: user.id })

    return NextResponse.json({
      tickets: tickets || [],
      stats: stats?.[0] || { total_tickets: 0, open_tickets: 0, resolved_tickets: 0, unread_tickets: 0 },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Tickets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new ticket
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { category_id, subject, message, priority, order_id, guest_email, guest_name } = body

    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    if (!user && (!guest_email || !guest_name)) {
      return NextResponse.json({ error: 'Guest name and email are required for non-authenticated users' }, { status: 400 })
    }

    // Create ticket using function
    const { data, error } = await supabase
      .rpc('create_support_ticket', {
        p_user_id: user?.id || null,
        p_category_id: category_id || null,
        p_subject: subject,
        p_message: message,
        p_priority: priority || 'normal',
        p_order_id: order_id || null,
        p_guest_email: guest_email || null,
        p_guest_name: guest_name || null
      })

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    const result = data?.[0]

    if (!result?.success) {
      return NextResponse.json({ error: result?.message || 'Failed to create ticket' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      ticket_id: result.ticket_id,
      ticket_number: result.ticket_number,
      message: result.message
    })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
