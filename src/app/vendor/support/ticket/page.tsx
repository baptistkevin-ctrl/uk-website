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
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-blue-100 text-blue-700',
  awaiting_customer: 'bg-amber-100 text-amber-700',
  resolved: 'bg-gray-100 text-gray-700',
  closed: 'bg-gray-100 text-gray-500',
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
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600">Submit and track your support requests</p>
          </div>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); setSuccess(null); setError(null) }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* New Ticket Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-lg">Submit a New Ticket</h2>

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
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Describe your issue in detail. Include order numbers, product names, or screenshots if relevant."
              required
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
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
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-semibold text-gray-900">Your Tickets</h2>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/account/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                    <MessageSquare className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">#{ticket.ticket_number}</span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
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
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-4">Submit a ticket when you need help from our support team.</p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
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
