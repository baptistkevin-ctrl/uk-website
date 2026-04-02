import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:delivery:zones' })

export const dynamic = 'force-dynamic'

// Get all delivery zones or check a specific postcode
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const postcode = searchParams.get('postcode')

    if (postcode) {
      // Check specific postcode
      const { data: zoneId, error: zoneError } = await supabase
        .rpc('get_delivery_zone_for_postcode', {
          p_postcode: postcode
        })

      if (zoneError || !zoneId) {
        return NextResponse.json({
          available: false,
          message: 'Delivery not available for this postcode',
          postcode
        })
      }

      // Get zone details
      const { data: zone, error: zoneDetailsError } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('id', zoneId)
        .single()

      if (zoneDetailsError || !zone) {
        return NextResponse.json({
          available: false,
          message: 'Zone not found'
        })
      }

      return NextResponse.json({
        available: true,
        zone,
        postcode
      })
    }

    // Get all active zones
    const { data: zones, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      log.error('Error fetching zones', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 })
    }

    return NextResponse.json({ zones: zones || [] })
  } catch (error) {
    log.error('Delivery zones API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Check delivery availability (POST for more complex queries)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { postcode, order_total_pence } = body

    if (!postcode) {
      return NextResponse.json({ error: 'Postcode required' }, { status: 400 })
    }

    // Get zone for postcode
    const { data: zoneId, error: zoneError } = await supabase
      .rpc('get_delivery_zone_for_postcode', {
        p_postcode: postcode
      })

    if (zoneError || !zoneId) {
      return NextResponse.json({
        available: false,
        message: 'Sorry, we don\'t deliver to this area yet',
        postcode
      })
    }

    // Get zone details
    const { data: zone, error: zoneDetailsError } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('id', zoneId)
      .single()

    if (zoneDetailsError || !zone) {
      return NextResponse.json({
        available: false,
        message: 'Zone configuration error'
      })
    }

    // Check minimum order
    if (order_total_pence && order_total_pence < zone.min_order_pence) {
      return NextResponse.json({
        available: true,
        zone,
        meets_minimum: false,
        min_order_pence: zone.min_order_pence,
        message: `Minimum order for this area is £${(zone.min_order_pence / 100).toFixed(2)}`
      })
    }

    // Calculate delivery fee
    let delivery_fee_pence = zone.base_fee_pence
    let is_free_delivery = false

    if (zone.free_delivery_threshold_pence && order_total_pence >= zone.free_delivery_threshold_pence) {
      delivery_fee_pence = 0
      is_free_delivery = true
    }

    const amount_for_free_delivery = zone.free_delivery_threshold_pence
      ? Math.max(0, zone.free_delivery_threshold_pence - (order_total_pence || 0))
      : null

    return NextResponse.json({
      available: true,
      zone,
      meets_minimum: true,
      delivery_fee_pence,
      is_free_delivery,
      amount_for_free_delivery,
      free_delivery_threshold_pence: zone.free_delivery_threshold_pence
    })
  } catch (error) {
    log.error('Delivery check error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
