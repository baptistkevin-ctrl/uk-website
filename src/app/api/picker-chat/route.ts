import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

import { sanitizeText } from '@/lib/security'

export const dynamic = 'force-dynamic'

const MESSAGE_TYPES = ['text', 'preference', 'photo_request', 'photo_response', 'substitution', 'system'] as const
type MessageType = (typeof MESSAGE_TYPES)[number]

interface ChatMessageRow {
  id: string
  order_id: string
  sender_id: string
  sender_name: string
  sender_role: 'customer' | 'picker'
  message: string
  type: MessageType
  image_url: string | null
  created_at: string
  read: boolean
}

interface ChatMessageResponse {
  id: string
  orderId: string
  senderId: string
  senderName: string
  senderRole: 'customer' | 'picker'
  message: string
  type: MessageType
  imageUrl?: string
  timestamp: string
  read: boolean
}

function formatMessage(row: ChatMessageRow): ChatMessageResponse {
  return {
    id: row.id,
    orderId: row.order_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    message: row.message,
    type: row.type,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    timestamp: row.created_at,
    read: row.read,
  }
}

function isTableMissing(error: { code?: string; message?: string }): boolean {
  const msg = error.message || ''
  return (
    error.code === '42P01' ||
    (msg.includes('relation') && msg.includes('does not exist'))
  )
}

// GET /api/picker-chat?orderId=XXX - Get chat messages for an order
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify the order belongs to the authenticated user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, user_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      // Check if user is admin or picker
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isPrivileged = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'picker'
      if (!isPrivileged) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Try to fetch messages from picker_chat_messages table
    let messages: ChatMessageResponse[] = []
    let pickerName: string | null = null
    let isPickerOnline = false

    const { data: chatMessages, error: chatError } = await supabaseAdmin
      .from('picker_chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (chatError && isTableMissing(chatError)) {
      // Table doesn't exist yet - return empty gracefully
      return NextResponse.json({
        messages: [],
        orderStatus: order.status || 'unknown',
        pickerName: null,
        isPickerOnline: false,
      })
    }

    if (chatError) {
      console.error('Picker chat query error:', chatError)
      return NextResponse.json({
        messages: [],
        orderStatus: order.status || 'unknown',
        pickerName: null,
        isPickerOnline: false,
      })
    }

    messages = (chatMessages || []).map(formatMessage)

    // Try to get picker info from order or a picker assignment table
    const { data: pickerAssignment } = await supabaseAdmin
      .from('picker_assignments')
      .select('picker_id, profiles(full_name)')
      .eq('order_id', orderId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (pickerAssignment) {
      const profileData = pickerAssignment.profiles as { full_name?: string } | null
      pickerName = profileData?.full_name || 'Your Picker'
      // Check if picker was active in the last 5 minutes
      const { data: pickerActivity } = await supabaseAdmin
        .from('picker_chat_messages')
        .select('created_at')
        .eq('order_id', orderId)
        .eq('sender_role', 'picker')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (pickerActivity) {
        const lastActive = new Date(pickerActivity.created_at).getTime()
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        isPickerOnline = lastActive > fiveMinutesAgo
      }
    }

    return NextResponse.json({
      messages,
      orderStatus: order.status || 'unknown',
      pickerName,
      isPickerOnline,
    })
  } catch (error) {
    console.error('Picker chat GET error:', error)
    return NextResponse.json({
      messages: [],
      orderStatus: 'unknown',
      pickerName: null,
      isPickerOnline: false,
    })
  }
}

// POST /api/picker-chat - Send a message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, message, type = 'text' } = body

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    if (!MESSAGE_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify order ownership
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, user_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Determine sender role
    let senderRole: 'customer' | 'picker' = 'customer'
    if (order.user_id !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'picker') {
        senderRole = 'picker'
      } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
        senderRole = 'picker' // Admins act as picker in chat
      } else {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get sender name from profile
    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const senderName = senderProfile?.full_name || 'User'
    const sanitizedMessage = sanitizeText(message)

    // Insert message into picker_chat_messages
    const { data: insertedMessage, error: insertError } = await supabaseAdmin
      .from('picker_chat_messages')
      .insert({
        order_id: orderId,
        sender_id: user.id,
        sender_name: senderName,
        sender_role: senderRole,
        message: sanitizedMessage,
        type,
        read: false,
      })
      .select()
      .single()

    if (insertError) {
      if (isTableMissing(insertError)) {
        // Table doesn't exist - return a mock response so the UI still works
        return NextResponse.json({
          message: {
            id: crypto.randomUUID(),
            orderId,
            senderId: user.id,
            senderName,
            senderRole,
            message: sanitizedMessage,
            type,
            timestamp: new Date().toISOString(),
            read: false,
          },
          fallback: true,
        })
      }

      console.error('Picker chat insert error:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({
      message: formatMessage(insertedMessage),
    })
  } catch (error) {
    console.error('Picker chat POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
