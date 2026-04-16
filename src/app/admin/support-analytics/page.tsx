'use client'

import { useState, useEffect } from 'react'
import {
  MessageCircle, Clock, Star, TrendingUp, Bot, Users, Headphones,
  Loader2, RefreshCw, CheckCircle, AlertTriangle, Ticket,
  BarChart3, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
  overview: {
    totalChats: number
    todayChats: number
    activeChats: number
    resolvedChats: number
    resolutionRate: number
    avgResponseMinutes: number
    avgSatisfaction: number
    satisfactionCount: number
  }
  bot: {
    botHandled: number
    humanHandled: number
    botResolutionRate: number
    handoffRate: number
  }
  tickets: {
    total: number
    open: number
    resolved: number
    highPriority: number
  }
  ratingDistribution: { star: number; count: number }[]
  dailyVolume: { date: string; day: string; chats: number; tickets: number }[]
  channelBreakdown: { live_chat: number; vendor_chat: number; order_chat: number }
}

export default function SupportAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/support-analytics')
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-(--color-text-muted)">Failed to load analytics</div>

  const o = data.overview
  const maxVolume = Math.max(...data.dailyVolume.map(d => d.chats + d.tickets), 1)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Headphones className="h-6 w-6 text-(--brand-primary)" />
            Support Analytics
          </h1>
          <p className="text-(--color-text-muted) mt-1">Chat performance, bot efficiency, and customer satisfaction</p>
        </div>
        <Button variant="outline" onClick={() => { setLoading(true); fetchData() }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--brand-primary-light) flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-(--brand-primary)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{o.totalChats}</p>
          <p className="text-sm text-(--color-text-muted)">Total Chats (30d)</p>
          <p className="text-xs text-(--color-text-disabled) mt-0.5">{o.todayChats} today</p>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--color-success-bg) flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-(--color-success)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-(--color-success)">{o.resolutionRate}%</p>
          <p className="text-sm text-(--color-text-muted)">Resolution Rate</p>
          <p className="text-xs text-(--color-text-disabled) mt-0.5">{o.resolvedChats} resolved</p>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--brand-amber)/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-(--brand-amber)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{o.avgResponseMinutes}<span className="text-sm font-normal text-(--color-text-muted)"> min</span></p>
          <p className="text-sm text-(--color-text-muted)">Avg Response Time</p>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--brand-amber)/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-(--brand-amber)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{o.avgSatisfaction}<span className="text-sm font-normal text-(--color-text-muted)"> /5</span></p>
          <p className="text-sm text-(--color-text-muted)">Satisfaction Score</p>
          <p className="text-xs text-(--color-text-disabled) mt-0.5">{o.satisfactionCount} ratings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Performance */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-(--color-text-muted)" />
            FreshBot Performance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-(--brand-primary)" />
                <div>
                  <p className="font-medium text-foreground text-sm">Bot Handled</p>
                  <p className="text-xs text-(--color-text-muted)">Resolved without human</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">{data.bot.botHandled}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-(--color-info)" />
                <div>
                  <p className="font-medium text-foreground text-sm">Human Handled</p>
                  <p className="text-xs text-(--color-text-muted)">Transferred to agent</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">{data.bot.humanHandled}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-(--color-success)" />
                <div>
                  <p className="font-medium text-foreground text-sm">Bot Resolution Rate</p>
                  <p className="text-xs text-(--color-text-muted)">Solved by FreshBot alone</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-(--color-success)">{data.bot.botResolutionRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-(--color-warning)" />
                <div>
                  <p className="font-medium text-foreground text-sm">Handoff Rate</p>
                  <p className="text-xs text-(--color-text-muted)">Needed human intervention</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-(--color-warning)">{data.bot.handoffRate}%</span>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-(--color-text-muted)" />
            Rating Distribution
          </h2>
          <div className="space-y-3">
            {data.ratingDistribution.reverse().map(({ star, count }) => {
              const maxCount = Math.max(...data.ratingDistribution.map(r => r.count), 1)
              const width = (count / maxCount) * 100
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground w-12 flex items-center gap-1">
                    {star} <Star className="h-3 w-3 fill-(--brand-amber) text-(--brand-amber)" />
                  </span>
                  <div className="flex-1 h-6 bg-(--color-elevated) rounded-full overflow-hidden">
                    <div
                      className="h-full bg-(--brand-amber) rounded-full transition-all"
                      style={{ width: `${Math.max(width, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-(--color-text-muted) w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>

          {/* Tickets Summary */}
          <div className="mt-6 pt-6 border-t border-(--color-border)">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-(--color-text-muted)" />
              Support Tickets
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background rounded-lg text-center">
                <p className="text-lg font-bold font-mono text-foreground">{data.tickets.open}</p>
                <p className="text-xs text-(--color-text-muted)">Open</p>
              </div>
              <div className="p-3 bg-background rounded-lg text-center">
                <p className="text-lg font-bold font-mono text-(--color-success)">{data.tickets.resolved}</p>
                <p className="text-xs text-(--color-text-muted)">Resolved</p>
              </div>
              <div className="p-3 bg-background rounded-lg text-center">
                <p className="text-lg font-bold font-mono text-(--color-error)">{data.tickets.highPriority}</p>
                <p className="text-xs text-(--color-text-muted)">High Priority</p>
              </div>
              <div className="p-3 bg-background rounded-lg text-center">
                <p className="text-lg font-bold font-mono text-foreground">{data.tickets.total}</p>
                <p className="text-xs text-(--color-text-muted)">Total (30d)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Volume Chart */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-(--color-text-muted)" />
          Daily Support Volume (Last 7 Days)
        </h2>
        <div className="flex items-end gap-3" style={{ height: 200 }}>
          {data.dailyVolume.map((day, i) => {
            const chatHeight = (day.chats / maxVolume) * 100
            const ticketHeight = (day.tickets / maxVolume) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[10px] text-(--color-text-muted) font-mono">{day.chats + day.tickets}</p>
                <div className="w-full flex items-end gap-0.5" style={{ height: '160px' }}>
                  <div
                    className="flex-1 bg-(--brand-primary) rounded-t-sm transition-all hover:opacity-80"
                    style={{ height: `${Math.max(chatHeight, 2)}%` }}
                    title={`${day.chats} chats`}
                  />
                  <div
                    className="flex-1 bg-(--brand-amber) rounded-t-sm transition-all hover:opacity-80"
                    style={{ height: `${Math.max(ticketHeight, 2)}%` }}
                    title={`${day.tickets} tickets`}
                  />
                </div>
                <p className="text-xs text-(--color-text-muted)">{day.day}</p>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 justify-center text-xs text-(--color-text-muted)">
          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-(--brand-primary)" /> Chats</div>
          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-(--brand-amber)" /> Tickets</div>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="font-semibold text-foreground mb-4">Channel Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-background rounded-lg text-center">
            <MessageCircle className="h-6 w-6 text-(--brand-primary) mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">{data.channelBreakdown.live_chat}</p>
            <p className="text-xs text-(--color-text-muted)">Live Chat</p>
          </div>
          <div className="p-4 bg-background rounded-lg text-center">
            <Headphones className="h-6 w-6 text-(--brand-amber) mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">{data.channelBreakdown.vendor_chat}</p>
            <p className="text-xs text-(--color-text-muted)">Vendor Chat</p>
          </div>
          <div className="p-4 bg-background rounded-lg text-center">
            <Ticket className="h-6 w-6 text-(--color-info) mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-foreground">{data.channelBreakdown.order_chat}</p>
            <p className="text-xs text-(--color-text-muted)">Order Chat</p>
          </div>
        </div>
      </div>
    </div>
  )
}
