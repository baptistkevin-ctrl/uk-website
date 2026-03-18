import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const offset = (page - 1) * limit

    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        role,
        is_banned,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Search by email or name
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Filter by role
    if (role) {
      query = query.eq('role', role)
    }

    // Filter by status
    if (status === 'banned') {
      query = query.eq('is_banned', true)
    } else if (status === 'active') {
      query = query.eq('is_banned', false)
    }

    const { data: users, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get order counts for each user
    const userIds = users?.map(u => u.id) || []
    const { data: orderCounts } = await supabase
      .from('orders')
      .select('user_id')
      .in('user_id', userIds)

    // Count orders per user
    const orderCountMap: Record<string, number> = {}
    orderCounts?.forEach(o => {
      orderCountMap[o.user_id] = (orderCountMap[o.user_id] || 0) + 1
    })

    // Add order count to users
    const usersWithStats = users?.map(u => ({
      ...u,
      order_count: orderCountMap[u.id] || 0
    }))

    return NextResponse.json({
      users: usersWithStats,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
