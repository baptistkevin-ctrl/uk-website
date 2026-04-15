'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  status: string
  priority: string
  created_at: string
  category?: { name: string } | null
}

const priorityColors: Record<string, string> = {
  low: 'bg-(--color-elevated) text-foreground',
  normal: 'bg-(--color-info-bg) text-(--color-info)',
  high: 'bg-(--color-warning-bg) text-(--brand-amber)',
  urgent: 'bg-(--color-error-bg) text-(--color-error)',
}

const statusColors: Record<string, string> = {
  open: 'bg-(--brand-primary-light) text-(--brand-primary)',
  in_progress: 'bg-(--color-info-bg) text-(--color-info)',
  awaiting_customer: 'bg-(--brand-amber-soft) text-(--brand-amber)',
  resolved: 'bg-(--color-elevated) text-foreground',
  closed: 'bg-(--color-elevated) text-(--color-text-muted)',
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  awaiting_customer: 'Awaiting Response',
  resolved: 'Resolved',
  closed: 'Closed',
}

export default function VendorTicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch {
      // tickets table may not exist yet
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(`Ticket #${data.ticket_number} created. We'll respond within 24 hours.`)
        setFormData({ subject: '', message: '', priority: 'normal' })
        setShowForm(false)
        fetchTickets()
      } else {
        setError(data.error || 'Failed to create ticket')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/support">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-(--color-text-secondary)">Submit and track your support requests</p>
          </div>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); setSuccess(null); setError(null) }}
          className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-(--brand-primary-light) border border-(--brand-primary)/20 rounded-xl text-(--brand-primary)">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-(--color-error-bg) border border-(--color-border) rounded-xl text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* New Ticket Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-lg">Submit a New Ticket</h2>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="mt-1"
              placeholder="Briefly describe your issue"
              required
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={5}
              className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
              placeholder="Describe your issue in detail. Include order numbers, product names, or screenshots if relevant."
              required
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Submit Ticket</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Tickets List */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border)">
        <div className="p-6 border-b border-(--color-border)">
          <h2 className="font-semibold text-foreground">Your Tickets</h2>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-(--color-border)">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/account/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 bg-(--color-elevated) rounded-lg shrink-0">
                    <MessageSquare className="h-5 w-5 text-(--color-text-secondary)" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-(--color-text-muted)">#{ticket.ticket_number}</span>
                      <span className="text-(--color-text-disabled)">|</span>
                      <span className="flex items-center gap-1 text-xs text-(--color-text-muted)">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColors[ticket.priority] || priorityColors.normal}`}>
                    {ticket.priority}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[ticket.status] || statusColors.open}`}>
                    {statusLabels[ticket.status] || ticket.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No tickets yet</h3>
            <p className="text-(--color-text-muted) mb-4">Submit a ticket when you need help from our support team.</p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ticket
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
