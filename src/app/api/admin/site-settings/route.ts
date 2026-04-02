import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:site-settings' })

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // Get settings (or create if not exists)
    let { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      // No settings exist, create default
      const { data: newSettings, error: insertError } = await supabase
        .from('site_settings')
        .insert({})
        .select()
        .single()

      if (insertError) {
        log.error('Error creating settings', { error: insertError instanceof Error ? insertError.message : String(insertError) })
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }

      settings = newSettings
    } else if (error) {
      log.error('Error fetching settings', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    log.error('Get settings error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const updates = await request.json()

    // Get existing settings
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .single()

    if (!existing) {
      // Create new with updates
      const { data: settings, error } = await supabase
        .from('site_settings')
        .insert(updates)
        .select()
        .single()

      if (error) {
        log.error('Error creating settings', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }

      return NextResponse.json({ settings })
    }

    // Update existing
    const { data: settings, error } = await supabase
      .from('site_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      log.error('Error updating settings', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    log.error('Update settings error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
