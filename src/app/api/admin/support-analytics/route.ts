import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const supabaseAdmin = getSupabaseAdmin()
  const now = new Date()
  const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgoISO = new Date(now.getTime() - 7 * 86400000).toISOString()
  const monthAgoISO = new Date(now.getTime() - 30 * 86400000).toISOString()

  try {
    // Fetch all conversations
    const [conversationsResult, ticketsResult, chatbotResult] = await Promise.all([
      supabaseAdmin
        .from('chat_conversations')
        .select('id, status, created_at, resolved_at, rating, channel_type, assigned_agent_id')
        .gte('created_at', monthAgoISO)
        .order('created_at', { ascending: false }),

      supabaseAdmin
        .from('support_tickets')
        .select('id, status, priority, created_at, resolved_at, category_id')
        .gte('created_at', monthAgoISO)
        .order('created_at', { ascending: false }),

      supabaseAdmin
        .from('chatbot_analytics')
        .select('*')
        .limit(1)
        .maybeSingle(),
    ])

    const conversations = conversationsResult.data || []
    const tickets = ticketsResult.data || []

    // Chat metrics
    const totalChats = conversations.length
    const todayChats = conversations.filter(c => c.created_at >= todayISO).length
    const resolvedChats = conversations.filter(c => c.status === 'resolved' || c.status === 'closed').length
    const activeChats = conversations.filter(c => c.status === 'active' || c.status === 'waiting').length

    // Resolution rate
    const resolutionRate = totalChats > 0 ? Math.round((resolvedChats / totalChats) * 100) : 0

    // Average response time (estimated from created_at to resolved_at)
    const resolvedWithTime = conversations.filter(c => c.resolved_at && c.created_at)
    let avgResponseMinutes = 0
    if (resolvedWithTime.length > 0) {
      const totalMinutes = resolvedWithTime.reduce((sum, c) => {
        const diff = new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()
        return sum + diff / 60000
      }, 0)
      avgResponseMinutes = Math.round(totalMinutes / resolvedWithTime.length)
    }

    // Satisfaction score (average rating)
    const ratedChats = conversations.filter(c => c.rating && c.rating > 0)
    const avgSatisfaction = ratedChats.length > 0
      ? Math.round((ratedChats.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedChats.length) * 10) / 10
      : 0
    const satisfactionCount = ratedChats.length

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: ratedChats.filter(c => c.rating === star).length,
    }))

    // Bot vs Human handled
    const botHandled = conversations.filter(c => !c.assigned_agent_id).length
    const humanHandled = conversations.filter(c => c.assigned_agent_id).length
    const botResolutionRate = botHandled > 0
      ? Math.round((conversations.filter(c => !c.assigned_agent_id && (c.status === 'resolved' || c.status === 'closed')).length / botHandled) * 100)
      : 0

    // Ticket metrics
    const totalTickets = tickets.length
    const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
    const highPriorityTickets = tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length

    // Daily chat volume (last 7 days)
    const dailyVolume = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayChats = conversations.filter(c => c.created_at.startsWith(dateStr))
      const dayTickets = tickets.filter(t => t.created_at.startsWith(dateStr))
      dailyVolume.push({
        date: dateStr,
        day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        chats: dayChats.length,
        tickets: dayTickets.length,
      })
    }

    // Channel breakdown
    const channelBreakdown = {
      live_chat: conversations.filter(c => c.channel_type === 'live_chat' || !c.channel_type).length,
      vendor_chat: conversations.filter(c => c.channel_type === 'vendor_chat').length,
      order_chat: conversations.filter(c => c.channel_type === 'order_chat').length,
    }

    return NextResponse.json({
      overview: {
        totalChats,
        todayChats,
        activeChats,
        resolvedChats,
        resolutionRate,
        avgResponseMinutes,
        avgSatisfaction,
        satisfactionCount,
      },
      bot: {
        botHandled,
        humanHandled,
        botResolutionRate,
        handoffRate: totalChats > 0 ? Math.round((humanHandled / totalChats) * 100) : 0,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
        highPriority: highPriorityTickets,
      },
      ratingDistribution,
      dailyVolume,
      channelBreakdown,
    })
  } catch (error) {
    console.error('Support analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch support analytics' }, { status: 500 })
  }
}
