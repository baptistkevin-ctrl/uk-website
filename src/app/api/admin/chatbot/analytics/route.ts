import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get chatbot analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
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

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get total conversations
    const { count: totalConversations } = await supabaseAdmin
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })

    // Get bot handled (where handoff_requested is false)
    const { count: botHandled } = await supabaseAdmin
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('handoff_requested', false)

    // Get handoff requested
    const { count: handoffRequested } = await supabaseAdmin
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('handoff_requested', true)

    // Get intent distribution from chat_messages metadata
    const { data: intentMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('metadata')
      .eq('sender_type', 'bot')
      .not('metadata', 'is', null)

    // Calculate average confidence and top intents
    let totalConfidence = 0
    let confidenceCount = 0
    const intentCounts: Record<string, number> = {}

    intentMessages?.forEach(msg => {
      const metadata = msg.metadata as { intent?: string; confidence?: number }
      if (metadata?.confidence) {
        totalConfidence += metadata.confidence
        confidenceCount++
      }
      if (metadata?.intent) {
        intentCounts[metadata.intent] = (intentCounts[metadata.intent] || 0) + 1
      }
    })

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0

    // Sort and get top intents
    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const total = totalConversations || 0
    const handoffs = handoffRequested || 0
    const handoffRate = total > 0 ? handoffs / total : 0

    return NextResponse.json({
      total_conversations: total,
      bot_handled: botHandled || 0,
      handoff_rate: handoffRate,
      avg_confidence: avgConfidence,
      top_intents: topIntents
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
