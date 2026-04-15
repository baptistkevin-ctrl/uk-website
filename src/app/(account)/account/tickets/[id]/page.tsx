'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Send, Clock, CheckCircle, AlertCircle, MessageSquare,
  XCircle, Package, User, Paperclip, MoreVertical
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TicketMessage {
  id: string
  sender_type: 'customer' | 'agent' | 'system'
  message: string
  attachments: { name: string; url: string }[]
  is_internal: boolean
  created_at: string
  sender: {
    id: string
    full_name: string
    avatar_url: string
    role: string
  } | null
}

interface SupportTicket {
  id: string
  ticket_number: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  category: {
    id: string
    name: string
    slug: string
    icon: string
  } | null
  order: {
    id: string
    order_number: string
    total_pence: number
    status: string
  } | null
  assigned: {
    id: string
    full_name: string
    avatar_url: string
  } | null
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

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTicket()
    }
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${params.id}`)
      if (!res.ok) {
        router.push('/account/tickets')
        return
      }
      const data = await res.json()
      setTicket(data.ticket)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching ticket:', error)
      router.push('/account/tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      })
      const data = await res.json()

      if (data.success) {
        setNewMessage('')
        fetchTicket()
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return

    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      })
      const data = await res.json()

      if (data.success) {
        fetchTicket()
      } else {
        toast.error(data.error || 'Failed to close ticket')
      }
    } catch (error) {
      console.error('Error closing ticket:', error)
      toast.error('Failed to close ticket')
    }
  }

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

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-(--color-text-muted)">Ticket not found</p>
        <Link href="/account/tickets" className="text-(--brand-primary) hover:underline mt-2 inline-block">
          Back to tickets
        </Link>
      </div>
    )
  }

  const StatusIcon = statusColors[ticket.status]?.icon || AlertCircle
  const isOpen = ['open', 'in_progress', 'awaiting_customer'].includes(ticket.status)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/account/tickets"
          className="inline-flex items-center gap-2 text-(--color-text-secondary) hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-(--color-text-disabled)">
                {ticket.ticket_number}
              </span>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]?.bg} ${statusColors[ticket.status]?.text}`}>
                <StatusIcon className="h-3 w-3" />
                {formatStatus(ticket.status)}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[ticket.priority]}`}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-(--color-text-muted)">
              {ticket.category && (
                <span>Category: {ticket.category.name}</span>
              )}
              <span>Created: {formatDate(ticket.created_at)}</span>
            </div>
          </div>
          {isOpen && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-(--color-elevated) rounded-lg"
              >
                <MoreVertical className="h-5 w-5 text-(--color-text-muted)" />
              </button>
              {showActions && (
                <div className="absolute right-0 mt-1 w-48 bg-(--color-surface) rounded-lg shadow-lg border py-1 z-10">
                  <button
                    onClick={handleCloseTicket}
                    className="w-full px-4 py-2 text-left text-sm text-(--color-text-secondary) hover:bg-background"
                  >
                    Close Ticket
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Info */}
      {ticket.order && (
        <div className="bg-(--color-info-bg) rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-(--color-info)" />
            <div>
              <p className="text-sm font-medium text-(--color-info)">
                Related Order: {ticket.order.order_number}
              </p>
              <p className="text-xs text-(--color-info)">
                £{(ticket.order.total_pence / 100).toFixed(2)} - {ticket.order.status}
              </p>
            </div>
          </div>
          <Link
            href={`/account/orders/${ticket.order.id}`}
            className="text-sm text-(--color-info) hover:underline"
          >
            View Order
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="bg-(--color-surface) rounded-xl border mb-4">
        <div className="p-4 border-b">
          <h2 className="font-medium text-foreground">Conversation</h2>
        </div>
        <div className="p-4 space-y-4 max-h-125 overflow-y-auto">
          {messages.map((msg) => {
            if (msg.sender_type === 'system') {
              return (
                <div key={msg.id} className="text-center">
                  <span className="inline-block px-3 py-1 bg-(--color-elevated) text-(--color-text-muted) text-sm rounded-full">
                    {msg.message}
                  </span>
                  <p className="text-xs text-(--color-text-disabled) mt-1">{formatDate(msg.created_at)}</p>
                </div>
              )
            }

            const isCustomer = msg.sender_type === 'customer'
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isCustomer ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCustomer ? 'bg-(--brand-primary-light)' : 'bg-(--color-info-bg)'
                }`}>
                  {msg.sender?.avatar_url ? (
                    <img
                      src={msg.sender.avatar_url}
                      alt={msg.sender.full_name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <User className={`h-5 w-5 ${isCustomer ? 'text-(--brand-primary)' : 'text-(--color-info)'}`} />
                  )}
                </div>
                <div className={`max-w-[70%] ${isCustomer ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {msg.sender?.full_name || (isCustomer ? 'You' : 'Support Agent')}
                    </span>
                    {!isCustomer && (msg.sender?.role === 'admin' || msg.sender?.role === 'super_admin') && (
                      <span className="px-1.5 py-0.5 bg-(--color-info-bg) text-(--color-info) text-xs rounded">
                        Support
                      </span>
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    isCustomer ? 'bg-(--brand-primary) text-white' : 'bg-(--color-elevated) text-foreground'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-(--color-info) hover:underline"
                        >
                          <Paperclip className="h-4 w-4" />
                          {att.name}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className={`text-xs text-(--color-text-disabled) mt-1 ${isCustomer ? 'text-right' : ''}`}>
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Form */}
      {isOpen ? (
        <form onSubmit={handleSendMessage} className="bg-(--color-surface) rounded-xl border p-4">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) resize-none"
            />
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-(--color-text-disabled)">
              Our support team typically responds within 24 hours
            </p>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="flex items-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-background rounded-xl border p-4 text-center">
          <p className="text-(--color-text-muted)">
            This ticket is {ticket.status}.
            {ticket.status === 'resolved' && ' If you need further assistance, please create a new ticket.'}
          </p>
        </div>
      )}

      {/* Assigned Agent */}
      {ticket.assigned && (
        <div className="mt-6 bg-(--color-surface) rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-(--color-info-bg) flex items-center justify-center">
              {ticket.assigned.avatar_url ? (
                <img
                  src={ticket.assigned.avatar_url}
                  alt={ticket.assigned.full_name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <User className="h-5 w-5 text-(--color-info)" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{ticket.assigned.full_name}</p>
              <p className="text-xs text-(--color-text-muted)">Assigned Support Agent</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
