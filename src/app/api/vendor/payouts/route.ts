import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get payouts
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('vendor_payouts')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (payoutsError) {
      console.error('Payouts error:', payoutsError)
    }

    // Get vendor orders summary for pending payouts
    const { data: vendorOrders } = await supabaseAdmin
      .from('vendor_orders')
      .select('vendor_amount, status')
      .eq('vendor_id', vendor.id)

    const pendingAmount = vendorOrders
      ?.filter(o => o.status === 'delivered' || o.status === 'transferred')
      .reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0

    const totalEarnings = vendorOrders
      ?.reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0

    const paidOut = payouts
      ?.filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount_pence || 0), 0) || 0

    return NextResponse.json({
      payouts: payouts || [],
      summary: {
        totalEarnings,
        pendingAmount,
        paidOut,
        available: Math.max(0, pendingAmount - paidOut)
      }
    })
  } catch (error) {
    console.error('Payouts error:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}
