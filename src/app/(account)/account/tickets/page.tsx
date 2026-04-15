'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket, Plus, Search, Filter, Clock, CheckCircle,
  AlertCircle, MessageSquare, ChevronRight, Package,
  CreditCard, User, ShoppingBag, Settings, RefreshCw,
  HelpCircle, XCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TicketCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
}

interface SupportTicket {
  id: string
  ticket_number: string
  subject: string
  status: string
  priority: string
  is_read_by_user: boolean
  created_at: string
  updated_at: string
  category: TicketCategory | null
  messages: { count: number }[]
}

interface TicketStats {
  total_tickets: number
  open_tickets: number
  resolved_tickets: number
  unread_tickets: number
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'package': Package,
  'credit-card': CreditCard,
  'user': User,
  'shopping-bag': ShoppingBag,
  'settings': Settings,
  'refresh-cw': RefreshCw,
  'message-square': MessageSquare,
  'help-circle': HelpCircle,
}

const statusColors: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  'open': { bg: 'bg-(--color-info-bg)', text: 'text-(--color-info)', icon: AlertCircle },
  'in_progress': { bg: 'bg-yellow-100', text: 'text-(--color-warning)', icon: Clock },
  'awaiting_customer': { bg: 'bg-purple-100', text: 'text-(--color-info)', icon: MessageSquare },
  'resolved': { bg: 'bg-(--brand-primary-light)', text: 'text-(--brand-primary)', icon: CheckCircle },
  'closed': { bg: 'bg-(--color-elevated)', text: 'text-(--color-text-secondary)', icon: XCircle },
}

const priorityColors: Record<string, string> = {
  'low': 'bg-(--color-elevated) text-(--color-text-secondary)',
  'normal': 'bg-(--color-info-bg) text-(--color-info)',
  'high': 'bg-(--brand-amber-soft) text-(--brand-amber)',
  'urgent': 'bg-(--color-error-bg) text-(--color-error)',
}

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [categories, setCategories] = useState<TicketCategory[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    category_id: '',
    subject: '',
    message: '',
    priority: 'normal'
  })

  useEffect(() => {
    fetchTickets()
    fetchCategories()
  }, [filter])

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/tickets?status=${filter}`)
      const data = await res.json()
      setTickets(data.tickets || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/tickets/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTicket.subject || !newTicket.message) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      })
      const data = await res.json()

      if (data.success) {
        setShowNewTicket(false)
        setNewTicket({ category_id: '', subject: '', message: '', priority: 'normal' })
        router.push(`/account/tickets/${data.ticket_id}`)
      } else {
        toast.error(data.error || 'Failed to create ticket')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brand-primary)"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-(--color-text-secondary) mt-1">Get help with your orders and account</p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-(--color-surface) rounded-xl p-4 border">
            <div className="text-2xl font-bold text-foreground">{stats.total_tickets}</div>
            <div className="text-sm text-(--color-text-muted)">Total Tickets</div>
          </div>
          <div className="bg-(--color-surface) rounded-xl p-4 border">
            <div className="text-2xl font-bold text-(--color-info)">{stats.open_tickets}</div>
            <div className="text-sm text-(--color-text-muted)">Open</div>
          </div>
          <div className="bg-(--color-surface) rounded-xl p-4 border">
            <div className="text-2xl font-bold text-(--brand-primary)">{stats.resolved_tickets}</div>
            <div className="text-sm text-(--color-text-muted)">Resolved</div>
          </div>
          <div className="bg-(--color-surface) rounded-xl p-4 border">
            <div className="text-2xl font-bold text-(--color-info)">{stats.unread_tickets}</div>
            <div className="text-sm text-(--color-text-muted)">Unread</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-(--color-surface) rounded-xl border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-(--color-text-disabled)" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-(--color-text-disabled)" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            >
              <option value="all">All Tickets</option>
              <option value="active">Active</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_customer">Awaiting Response</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-(--color-surface) rounded-xl border p-12 text-center">
          <Ticket className="h-16 w-16 text-(--color-text-disabled) mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No tickets found</h3>
          <p className="text-(--color-text-muted) mb-4">
            {filter === 'all'
              ? "You haven't created any support tickets yet."
              : `No tickets with status "${formatStatus(filter)}".`}
          </p>
          <button
            onClick={() => setShowNewTicket(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover)"
          >
            <Plus className="h-5 w-5" />
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const StatusIcon = statusColors[ticket.status]?.icon || AlertCircle
            return (
              <Link
                key={ticket.id}
                href={`/account/tickets/${ticket.id}`}
                className={`block bg-(--color-surface) rounded-xl border p-4 hover:border-(--brand-primary)/30 hover:shadow-sm transition-all ${
                  !ticket.is_read_by_user ? 'border-l-4 border-l-(--brand-primary)' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-(--color-text-disabled)">
                        {ticket.ticket_number}
                      </span>
                      {!ticket.is_read_by_user && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-(--brand-primary-light) text-(--brand-primary) rounded-full">
                          New Reply
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-foreground truncate">
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-(--color-text-muted)">
                      {ticket.category && (
                        <span className="flex items-center gap-1">
                          {iconMap[ticket.category.icon] && (
                            (() => {
                              const Icon = iconMap[ticket.category.icon]
                              return <Icon className="h-4 w-4" />
                            })()
                          )}
                          {ticket.category.name}
                        </span>
                      )}
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]?.bg} ${statusColors[ticket.status]?.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {formatStatus(ticket.status)}
                      </div>
                      <div className={`mt-1 inline-block px-2 py-0.5 rounded text-xs ${priorityColors[ticket.priority]}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-(--color-text-disabled)" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-(--color-surface) rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Create Support Ticket</h2>
              <p className="text-(--color-text-muted) text-sm mt-1">
                Describe your issue and we'll get back to you as soon as possible
              </p>
            </div>
            <form onSubmit={handleSubmitTicket} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1">
                  Category
                </label>
                <select
                  value={newTicket.category_id}
                  onChange={(e) => setNewTicket({ ...newTicket, category_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                >
                  <option value="low">Low - General inquiry</option>
                  <option value="normal">Normal - Standard support</option>
                  <option value="high">High - Urgent issue</option>
                  <option value="urgent">Urgent - Critical problem</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-1">
                  Message *
                </label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="Please describe your issue in detail. Include any relevant order numbers, screenshots, or other information that might help us assist you."
                  rows={5}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="flex-1 px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTicket.subject || !newTicket.message}
                  className="flex-1 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
