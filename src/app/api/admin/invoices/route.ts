import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:invoices' })

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
      .from('invoices')
      .select(`
        *,
        order:orders(id, order_number),
        user:profiles(id, full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: invoices, error } = await query

    if (error) {
      log.error('Error fetching invoices', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Calculate stats
    const allInvoices = invoices || []
    const stats = {
      total_invoices: allInvoices.length,
      total_value_pence: allInvoices.reduce((sum, inv) => sum + (inv.total_pence || 0), 0),
      paid_count: allInvoices.filter(i => i.status === 'paid').length,
      paid_value_pence: allInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_pence || 0), 0),
      pending_count: allInvoices.filter(i => i.status === 'pending' || i.status === 'issued').length
    }

    return NextResponse.json({ invoices: allInvoices, stats })
  } catch (error) {
    log.error('Get invoices error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
