import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor info
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })
    }

    // Verify conversation belongs to this vendor
    const { data: conversation } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, vendor_id')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check current status to prevent double-accept
    const { data: convStatus } = await supabaseAdmin
      .from('chat_conversations')
      .select('status, assigned_agent_id')
      .eq('id', id)
      .single()

    if (convStatus?.status === 'active' && convStatus?.assigned_agent_id) {
      return NextResponse.json({ error: 'Conversation already accepted' }, { status: 409 })
    }

    if (convStatus?.status === 'closed' || convStatus?.status === 'resolved') {
      return NextResponse.json({ error: 'Conversation is already closed' }, { status: 400 })
    }

    // Accept the conversation
    await supabaseAdmin
      .from('chat_conversations')
      .update({
        status: 'active',
        assigned_agent_id: user.id,
        unread_agent: 0
      })
      .eq('id', id)

    // Add system message
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id: id,
        sender_type: 'system',
        content: `${vendor.business_name} has joined the conversation.`
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vendor accept chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
