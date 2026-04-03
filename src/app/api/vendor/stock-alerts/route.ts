import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - List stock alerts for vendor's products only
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor record
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get vendor's product IDs
    const { data: vendorProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('vendor_id', vendor.id)

    const productIds = vendorProducts?.map(p => p.id) || []

    if (productIds.length === 0) {
      return NextResponse.json({
        alerts: [],
        stats: {
          total_alerts: 0,
          pending_alerts: 0,
          notified_alerts: 0,
          unique_products: 0,
        },
      })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Build query - only fetch alerts for vendor's products
    let query = supabaseAdmin
      .from('stock_alerts')
      .select(`
        *,
        product:products(id, name, slug, image_url, stock_quantity, price_pence),
        user:profiles(id, full_name, email)
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching vendor stock alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch stock alerts' }, { status: 500 })
    }

    const allAlerts = alerts || []

    // Compute stats from the vendor-scoped alerts
    const pendingAlerts = allAlerts.filter(a => a.status === 'active').length
    const notifiedAlerts = allAlerts.filter(a => a.status === 'notified').length

    return NextResponse.json({
      alerts: allAlerts,
      stats: {
        total_alerts: allAlerts.length,
        pending_alerts: pendingAlerts,
        notified_alerts: notifiedAlerts,
        unique_products: new Set(allAlerts.map(a => a.product_id)).size,
      },
    })
  } catch (error) {
    console.error('Vendor stock alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Mark alerts as resolved or notified (vendor can only update their own products' alerts)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor record
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const body = await request.json()
    const { alertId, status } = body

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    // Vendors can mark alerts as notified or cancelled
    const allowedStatuses = ['notified', 'cancelled']
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Allowed: notified, cancelled' },
        { status: 400 }
      )
    }

    // Get vendor's product IDs
    const { data: vendorProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('vendor_id', vendor.id)

    const productIds = vendorProducts?.map(p => p.id) || []

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    // Verify the alert belongs to one of the vendor's products
    const { data: alert, error: alertError } = await supabaseAdmin
      .from('stock_alerts')
      .select('id, product_id, status')
      .eq('id', alertId)
      .single()

    if (alertError || !alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    if (!productIds.includes(alert.product_id)) {
      return NextResponse.json({ error: 'Not authorized to update this alert' }, { status: 403 })
    }

    // Build update
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'notified') {
      updates.notified_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('stock_alerts')
      .update(updates)
      .eq('id', alertId)
      .select(`
        *,
        product:products(id, name, slug, image_url, stock_quantity, price_pence),
        user:profiles(id, full_name, email)
      `)
      .single()

    if (updateError) {
      console.error('Vendor stock alert update error:', updateError)
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    return NextResponse.json({ alert: updated })
  } catch (error) {
    console.error('Vendor stock alert update error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}
