import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get user's notification preferences
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use the RPC function to get or create preferences
    const { data, error } = await supabase
      .rpc('get_or_create_notification_preferences', {
        p_user_id: user.id
      })

    if (error) {
      console.error('Error fetching preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error('Notification preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_order_updates,
      email_promotions,
      email_price_drops,
      email_newsletter,
      push_order_updates,
      push_promotions,
      push_price_drops,
      sms_order_updates,
      sms_promotions
    } = body

    // Build update object with only provided fields
    const updateData: Record<string, boolean | string> = {
      updated_at: new Date().toISOString()
    }

    if (email_order_updates !== undefined) updateData.email_order_updates = email_order_updates
    if (email_promotions !== undefined) updateData.email_promotions = email_promotions
    if (email_price_drops !== undefined) updateData.email_price_drops = email_price_drops
    if (email_newsletter !== undefined) updateData.email_newsletter = email_newsletter
    if (push_order_updates !== undefined) updateData.push_order_updates = push_order_updates
    if (push_promotions !== undefined) updateData.push_promotions = push_promotions
    if (push_price_drops !== undefined) updateData.push_price_drops = push_price_drops
    if (sms_order_updates !== undefined) updateData.sms_order_updates = sms_order_updates
    if (sms_promotions !== undefined) updateData.sms_promotions = sms_promotions

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
