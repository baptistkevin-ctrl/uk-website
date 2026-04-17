import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// Get all conversations for agents
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabaseAdmin = getSupabaseAdmin()

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

    // Admin sees customer_admin and vendor_admin chats
    if (channelType) {
      query = query.eq('channel_type', channelType)
    } else {
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
    return NextResponse.json({ conversations: [] })
  }
}
