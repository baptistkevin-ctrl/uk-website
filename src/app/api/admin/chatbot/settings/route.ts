import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:chatbot:settings' })

export const dynamic = 'force-dynamic'

// Get chatbot settings
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

    const { data: settingsData, error } = await supabase
      .from('chatbot_settings')
      .select('setting_key, setting_value')

    if (error) {
      log.error('Error fetching settings', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Convert to object
    const settings: Record<string, unknown> = {}
    settingsData?.forEach(s => {
      settings[s.setting_key] = s.setting_value
    })

    return NextResponse.json({
      settings: {
        is_enabled: settings.is_enabled === true || settings.is_enabled === 'true',
        bot_name: settings.bot_name || 'FreshBot',
        welcome_message: settings.welcome_message || "Hi! I'm FreshBot, your virtual assistant. How can I help you today?",
        bot_avatar: settings.bot_avatar || '/images/bot-avatar.png',
        typing_delay_ms: parseInt(String(settings.typing_delay_ms || '1000')),
        fallback_threshold: parseFloat(String(settings.fallback_threshold || '0.3')),
        handoff_keywords: settings.handoff_keywords || ['agent', 'human', 'person', 'speak to someone']
      }
    })
  } catch (error) {
    log.error('Get settings error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update chatbot settings
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const {
      is_enabled,
      bot_name,
      welcome_message,
      bot_avatar,
      typing_delay_ms,
      fallback_threshold,
      handoff_keywords
    } = body

    // Upsert each setting
    const settingsToUpdate = [
      { setting_key: 'is_enabled', setting_value: is_enabled },
      { setting_key: 'bot_name', setting_value: bot_name },
      { setting_key: 'welcome_message', setting_value: welcome_message },
      { setting_key: 'bot_avatar', setting_value: bot_avatar },
      { setting_key: 'typing_delay_ms', setting_value: typing_delay_ms },
      { setting_key: 'fallback_threshold', setting_value: fallback_threshold },
      { setting_key: 'handoff_keywords', setting_value: handoff_keywords }
    ]

    for (const setting of settingsToUpdate) {
      await supabase
        .from('chatbot_settings')
        .upsert({
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Update settings error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
