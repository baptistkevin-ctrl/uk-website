import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/chat/transcript
 * Sends a chat transcript email to the customer
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { conversation_id } = await request.json()

    if (!conversation_id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch conversation
    const { data: conversation } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, created_at, guest_email')
      .eq('id', conversation_id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Fetch messages
    const { data: messages } = await supabaseAdmin
      .from('chat_messages')
      .select('sender_type, sender_name, content, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages to send' }, { status: 400 })
    }

    // Determine recipient email
    const email = user?.email || conversation.guest_email
    if (!email) {
      return NextResponse.json({ error: 'No email address available' }, { status: 400 })
    }

    // Build transcript HTML
    const dateStr = new Date(conversation.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    let transcriptHtml = ''
    for (const msg of messages) {
      const time = new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      const name = msg.sender_name || (msg.sender_type === 'bot' ? 'FreshBot' : msg.sender_type === 'customer' ? 'You' : 'Support Agent')
      const bgColor = msg.sender_type === 'customer' ? '#DCF8C6' : msg.sender_type === 'bot' ? '#F0F0F0' : '#E3F2FD'

      transcriptHtml += `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11px; color: #888; margin-bottom: 2px;">${name} · ${time}</div>
          <div style="background: ${bgColor}; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; max-width: 80%; display: inline-block;">
            ${msg.content.replace(/\n/g, '<br>')}
          </div>
        </div>
      `
    }

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background: #1B6B3A; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; font-size: 20px; margin: 0;">Chat Transcript</h1>
          <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 4px 0 0;">UK Grocery Store Support · ${dateStr}</p>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          ${transcriptHtml}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">
            This transcript was sent from UK Grocery Store support chat.<br>
            Need more help? Visit <a href="https://uk-grocery-store.com/account/tickets" style="color: #1B6B3A;">our support page</a>.
          </p>
        </div>
      </div>
    `

    // Send email
    const { sendEmail } = await import('@/lib/email/send-email')
    await sendEmail({
      to: email,
      subject: `Your Chat Transcript — UK Grocery Store (${dateStr})`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Transcript email error:', error)
    return NextResponse.json({ error: 'Failed to send transcript' }, { status: 500 })
  }
}
