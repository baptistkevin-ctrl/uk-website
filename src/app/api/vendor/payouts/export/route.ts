import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { data: orders, error } = await supabaseAdmin
      .from('vendor_orders')
      .select('order_id, total_amount, commission_amount, vendor_amount, status, stripe_transfer_id, created_at, order:order_id(order_number)')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    const headers = [
      'Date', 'Order Number', 'Order Total (£)', 'Commission (£)',
      'Your Earnings (£)', 'Status', 'Stripe Transfer ID'
    ]

    const rows = (orders || []).map(o => {
      const order = o.order as unknown as { order_number: string } | null
      return [
        o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB') : '',
        order?.order_number || '',
        ((o.total_amount || 0) / 100).toFixed(2),
        ((o.commission_amount || 0) / 100).toFixed(2),
        ((o.vendor_amount || 0) / 100).toFixed(2),
        o.status || '',
        o.stripe_transfer_id || '',
      ]
    })

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const filename = `${vendor.business_name.replace(/[^a-zA-Z0-9]/g, '-')}-payouts-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Payout export error:', error)
    return NextResponse.json({ error: 'Failed to export payouts' }, { status: 500 })
  }
}
