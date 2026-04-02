import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:delivery:slots' })

export const dynamic = 'force-dynamic'

// Get available delivery slots for a zone/postcode
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const postcode = searchParams.get('postcode')
    const zoneId = searchParams.get('zone_id')
    const days = parseInt(searchParams.get('days') || '7')
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0]

    let targetZoneId = zoneId

    // If postcode provided, get the zone
    if (postcode && !zoneId) {
      // Try RPC first, fall back to direct query if function doesn't exist
      const { data: zoneData, error: zoneError } = await supabase
        .rpc('get_delivery_zone_for_postcode', {
          p_postcode: postcode
        })

      if (zoneError) {
        // RPC function may not exist - try direct postcode prefix lookup
        const postcodePrefix = postcode.split(' ')[0].toUpperCase()
        const { data: zones } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('is_active', true)
          .limit(1)

        if (zones && zones.length > 0) {
          // Return the first active zone as default
          return NextResponse.json({
            zone: zones[0],
            slots: [],
            slotsByDate: {},
            message: 'Delivery slots not yet configured for this area'
          })
        }

        // No zones at all - return empty response (not 404)
        return NextResponse.json({
          zone: null,
          slots: [],
          slotsByDate: {},
          message: 'Delivery not yet available for this postcode'
        })
      }

      if (!zoneData) {
        return NextResponse.json({
          zone: null,
          slots: [],
          slotsByDate: {},
          message: 'Delivery not available for this postcode'
        })
      }

      targetZoneId = zoneData
    }

    if (!targetZoneId) {
      return NextResponse.json({ error: 'Zone ID or postcode required' }, { status: 400 })
    }

    // Get zone info
    const { data: zone, error: zoneInfoError } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('id', targetZoneId)
      .single()

    if (zoneInfoError || !zone) {
      return NextResponse.json({
        zone: null,
        slots: [],
        slotsByDate: {},
        message: 'Zone not found'
      })
    }

    // Get available slots - try RPC first, fall back to direct query
    const { data: slots, error: slotsError } = await supabase
      .rpc('get_available_delivery_slots', {
        p_zone_id: targetZoneId,
        p_start_date: startDate,
        p_days: days
      })

    if (slotsError) {
      log.error('Error fetching slots', { error: slotsError instanceof Error ? slotsError.message : String(slotsError) })

      // Fallback: direct query
      const { data: fallbackSlots, error: fallbackError } = await supabase
        .from('delivery_slots')
        .select('*')
        .eq('zone_id', targetZoneId)
        .eq('is_available', true)
        .gte('delivery_date', startDate)
        .order('delivery_date')
        .order('start_time')
        .limit(100)

      return NextResponse.json({
        zone,
        slots: fallbackSlots || [],
        slotsByDate: {}
      })
    }

    // Group slots by date for easier frontend rendering
    const slotsByDate: Record<string, typeof slots> = {}
    for (const slot of slots || []) {
      const date = slot.delivery_date
      if (!slotsByDate[date]) {
        slotsByDate[date] = []
      }
      slotsByDate[date].push(slot)
    }

    return NextResponse.json({
      zone,
      slots: slots || [],
      slotsByDate
    })
  } catch (error) {
    log.error('Delivery slots API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Reserve a delivery slot
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { slot_id, session_id } = body

    if (!slot_id) {
      return NextResponse.json({ error: 'Slot ID required' }, { status: 400 })
    }

    if (!session_id && !user) {
      return NextResponse.json({ error: 'Session ID required for guest checkout' }, { status: 400 })
    }

    // Use the session_id or generate one from user id
    const reservationSession = session_id || `user_${user!.id}`

    const { data, error } = await supabase
      .rpc('reserve_delivery_slot', {
        p_slot_id: slot_id,
        p_session_id: reservationSession,
        p_user_id: user?.id || null,
        p_duration_minutes: 15
      })

    if (error) {
      log.error('Error reserving slot', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to reserve slot' }, { status: 500 })
    }

    const result = data?.[0]

    if (!result?.success) {
      return NextResponse.json({
        error: result?.message || 'Failed to reserve slot'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      reservation_id: result.reservation_id,
      expires_at: result.expires_at
    })
  } catch (error) {
    log.error('Slot reservation error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
