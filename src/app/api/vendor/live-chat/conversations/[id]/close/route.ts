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

    // Verify vendor owns this conversation
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })
    }

    const { data: conversation } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, vendor_id')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const body = await request.json()
    const requestedStatus = body.status || 'resolved'
    const status = ['resolved', 'closed'].includes(requestedStatus) ? requestedStatus : 'resolved'

    await supabaseAdmin
      .from('chat_conversations')
      .update({
        status,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)

    await supabaseAdmin
      .from('chat_messages')
      .insert({
        conversation_id: id,
        sender_type: 'system',
        content: `This conversation has been ${status}.`
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vendor close chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
