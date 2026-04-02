import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:vendor:stats' })

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
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get product stats
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)

    const { count: activeProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)

    // Get order stats from vendor_orders
    const { data: orderStats } = await supabaseAdmin
      .from('vendor_orders')
      .select('status, vendor_amount')
      .eq('vendor_id', vendor.id)

    const totalOrders = orderStats?.length || 0
    const pendingOrders = orderStats?.filter(o => o.status === 'pending').length || 0
    const totalRevenue = orderStats?.reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0

    // Get pending payout (orders that are delivered but not yet paid)
    const pendingPayout = orderStats
      ?.filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.vendor_amount || 0), 0) || 0

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalOrders,
      pendingOrders,
      totalRevenue,
      pendingPayout
    })
  } catch (error) {
    log.error('Vendor stats error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
