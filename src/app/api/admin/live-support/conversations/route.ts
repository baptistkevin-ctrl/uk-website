import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:live-support:conversations' })

export const dynamic = 'force-dynamic'

// Get all conversations for agents
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin/agent access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin', 'vendor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch conversations
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('chat_conversations')
      .select(`
        *,
        chat_messages (
          id,
          sender_type,
          sender_name,
          content,
          created_at
        )
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    } else {
      // Get all non-closed conversations
      query = query.in('status', ['waiting', 'active', 'resolved'])
    }

    const { data: conversations, error } = await query.limit(50)

    if (error) {
      log.error('Error fetching conversations', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ conversations: conversations || [] })
  } catch (error) {
    log.error('Live support API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
