'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MessageSquare, Search, Loader2, AlertTriangle, CheckCircle,
  Clock, User, ChevronLeft, ChevronRight, Filter, ArrowUpRight,
  XCircle, UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  assigned_to: string | null
  user: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
  assigned: { id: string; full_name: string | null; avatar_url: string | null } | null
  category: { id: string; name: string; slug: string } | null
  messages: { count: number }[] | null
}

interface Stats {
  total: number
  open: number
  in_progress: number
  awaiting_customer: number
  resolved: number
  closed: number
  urgent: number
  high: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-(--color-error)/10 text-(--color-error)', icon: AlertTriangle },
  in_progress: { label: 'In Progress', color: 'bg-(--color-info)/10 text-(--color-info)', icon: Clock },
  awaiting_customer: { label: 'Awaiting Customer', color: 'bg-(--color-warning)/10 text-(--color-warning)', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-(--color-success)/10 text-(--color-success)', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-(--color-elevated) text-(--color-text-muted)', icon: XCircle },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-(--color-elevated) text-(--color-text-secondary)' },
  medium: { label: 'Medium', color: 'bg-(--color-info)/10 text-(--color-info)' },
  high: { label: 'High', color: 'bg-(--color-warning)/10 text-(--color-warning)' },
  urgent: { label: 'Urgent', color: 'bg-(--color-error)/10 text-(--color-error)' },
}

export default function ComplaintsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [agents, setAgents] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => { fetchTickets() }, [statusFilter, priorityFilter, page])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/admin/tickets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
        setStats(data.stats || null)
        setAgents(data.agents || [])
        setTotalPages(Math.ceil((data.total || 0) / 20))
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const updateTicket = async (id: string, updates: Record<string, string | null>) => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        toast.success('Ticket updated')
        fetchTickets()
      } else {
        toast.error('Failed to update ticket')
      }
    } catch { toast.error('Failed to update ticket') }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchTickets()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-(--brand-primary)" />
          Customer Complaints & Tickets
        </h1>
        <p className="text-(--color-text-muted) mt-1">Manage support tickets, complaints, and customer issues</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Open', value: stats.open, color: 'text-(--color-error)' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-(--color-info)' },
            { label: 'Awaiting', value: stats.awaiting_customer, color: 'text-(--color-warning)' },
            { label: 'Resolved', value: stats.resolved, color: 'text-(--color-success)' },
            { label: 'Closed', value: stats.closed, color: 'text-(--color-text-muted)' },
            { label: 'Urgent', value: stats.urgent, color: 'text-(--color-error) font-bold' },
            { label: 'Total', value: stats.total, color: 'text-foreground' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3 text-center">
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-xs text-(--color-text-muted)">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ticket number or subject..." className="pl-10" />
          </form>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="h-10 px-3 border border-(--color-border) rounded-lg text-sm bg-(--color-surface)">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_customer">Awaiting Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1) }} className="h-10 px-3 border border-(--color-border) rounded-lg text-sm bg-(--color-surface)">
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" /></div>
      ) : tickets.length === 0 ? (
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No tickets found</h3>
          <p className="text-(--color-text-muted)">No complaints or tickets match your filters</p>
        </div>
      ) : (
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-(--color-text-muted) uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {tickets.map(ticket => {
                  const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open
                  const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium
                  const StatusIcon = statusConf.icon
                  const msgCount = Array.isArray(ticket.messages) && ticket.messages[0] ? (ticket.messages[0] as any).count : 0

                  return (
                    <tr key={ticket.id} className="hover:bg-background transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm font-medium text-foreground">{ticket.ticket_number}</p>
                        <p className="text-sm text-(--color-text-secondary) truncate max-w-60">{ticket.subject}</p>
                        {ticket.category && (
                          <span className="text-xs text-(--color-text-muted)">{ticket.category.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-(--color-elevated) flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-(--color-text-muted)" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{ticket.user?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-(--color-text-muted)">{ticket.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ticket.status}
                          onChange={e => updateTicket(ticket.id, { status: e.target.value })}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${statusConf.color}`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="awaiting_customer">Awaiting Customer</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ticket.priority}
                          onChange={e => updateTicket(ticket.id, { priority: e.target.value })}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${priorityConf.color}`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ticket.assigned_to || ''}
                          onChange={e => updateTicket(ticket.id, { assigned_to: e.target.value || null })}
                          className="text-xs px-2 py-1 border border-(--color-border) rounded-lg bg-background"
                        >
                          <option value="">Unassigned</option>
                          {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.full_name || 'Agent'}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-(--color-text-muted)">
                          {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-(--color-text-disabled)">
                          {msgCount} message{msgCount !== 1 ? 's' : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/account/tickets/${ticket.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="text-xs">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-(--color-border)">
              <p className="text-sm text-(--color-text-muted)">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
