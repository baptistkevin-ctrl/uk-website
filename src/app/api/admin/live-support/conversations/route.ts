import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ conversations: [] })
      }
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ conversations: conversations || [] })
  } catch (error) {
    console.error('Live support API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
