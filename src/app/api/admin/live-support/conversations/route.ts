import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

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

    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
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
    const channelType = searchParams.get('channel_type')

    let query = supabaseAdmin
      .from('chat_conversations')
      .select(`
        *,
        vendors (
          id,
          business_name,
          logo_url
        ),
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
      query = query.in('status', ['waiting', 'active', 'resolved'])
    }

    // Filter by channel type - vendors should only use their own endpoint
    if (profile.role === 'vendor') {
      return NextResponse.json({ error: 'Use /api/vendor/live-chat/conversations instead' }, { status: 403 })
    }

    if (channelType) {
      query = query.eq('channel_type', channelType)
    } else {
      // Admin sees customer_admin and vendor_admin chats
      query = query.in('channel_type', ['customer_admin', 'vendor_admin'])
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
