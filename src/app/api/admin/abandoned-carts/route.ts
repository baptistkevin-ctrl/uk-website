import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Build query
    let query = supabase
      .from('abandoned_carts')
      .select(`
        *,
        user:profiles(id, full_name, email),
        recovery_emails:cart_recovery_emails(id, email_number, sent_at, opened_at, clicked_at)
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: carts, error } = await query

    if (error) {
      console.error('Error fetching abandoned carts:', error)
      return NextResponse.json({ error: 'Failed to fetch abandoned carts' }, { status: 500 })
    }

    // Calculate stats
    const allCarts = carts || []
    const stats = {
      total_abandoned: allCarts.length,
      total_value_pence: allCarts.reduce((sum, cart) => sum + (cart.cart_total_pence || 0), 0),
      recovered_count: allCarts.filter(c => c.status === 'recovered').length,
      recovered_value_pence: allCarts
        .filter(c => c.status === 'recovered')
        .reduce((sum, cart) => sum + (cart.cart_total_pence || 0), 0),
      pending_count: allCarts.filter(c => c.status === 'abandoned').length
    }

    return NextResponse.json({ carts: allCarts, stats })
  } catch (error) {
    console.error('Get abandoned carts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
