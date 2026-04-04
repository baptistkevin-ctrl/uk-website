import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get conversations for vendor
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
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const channelType = searchParams.get('channel_type') || 'customer_vendor'

    let query = supabaseAdmin
      .from('chat_conversations')
      .select(`
        *,
        chat_messages (
          id,
          sender_type,
          sender_name,
          content,
          created_at
        ),
        orders:order_id (
          id,
          order_number,
          status,
          total_pence,
          created_at,
          customer_name,
          customer_email
        )
      `)
      .eq('vendor_id', vendor.id)
      .eq('channel_type', channelType)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.in('status', ['waiting', 'active', 'resolved'])
    }

    const { data: conversations, error } = await query.limit(50)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ conversations: [], vendor })
      }
      console.error('Error fetching vendor conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ conversations: conversations || [], vendor })
  } catch (error) {
    console.error('Vendor live chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
