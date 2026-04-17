import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// Get all tickets (admin)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigned = searchParams.get('assigned')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        category:ticket_categories(id, name, slug, icon),
        user:profiles!support_tickets_user_id_fkey(id, full_name, email, avatar_url),
        assigned:profiles!support_tickets_assigned_to_fkey(id, full_name, avatar_url),
        messages:ticket_messages(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.in('status', ['open', 'in_progress', 'awaiting_customer'])
      } else {
        query = query.eq('status', status)
      }
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }

    if (assigned === 'unassigned') {
      query = query.is('assigned_to', null)
    } else if (assigned === 'me') {
      query = query.eq('assigned_to', auth.user!.id)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,ticket_number.ilike.%${search}%`)
    }

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Get stats
    const { data: statsData } = await supabase
      .from('support_tickets')
      .select('status, priority')

    const stats = {
      total: statsData?.length || 0,
      open: statsData?.filter(t => t.status === 'open').length || 0,
      in_progress: statsData?.filter(t => t.status === 'in_progress').length || 0,
      awaiting_customer: statsData?.filter(t => t.status === 'awaiting_customer').length || 0,
      resolved: statsData?.filter(t => t.status === 'resolved').length || 0,
      closed: statsData?.filter(t => t.status === 'closed').length || 0,
      urgent: statsData?.filter(t => t.priority === 'urgent').length || 0,
      high: statsData?.filter(t => t.priority === 'high').length || 0,
    }

    // Get agents for assignment dropdown
    const { data: agents } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('role', 'admin')

    return NextResponse.json({
      tickets: tickets || [],
      stats,
      agents: agents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin tickets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
