'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  User, ArrowLeft, Package, ShoppingCart, Star, MapPin,
  Loader2, CheckCircle, Ban, Mail, Phone, Calendar,
  CreditCard, MessageSquare, Shield, Send, StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils/format'

interface CustomerDetail {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  is_banned: boolean
  created_at: string
  orders: { id: string; order_number: string; total_pence: number; status: string; created_at: string }[]
  order_count: number
  total_spent: number
  addresses: { id: string; label: string; address_line_1: string; city: string; postcode: string; is_default: boolean }[]
  review_count: number
}

export default function CustomerDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<{ text: string; date: string }[]>([])

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/admin/users/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setCustomer(data)
          // Load admin notes from localStorage (simple CRM)
          const savedNotes = localStorage.getItem(`admin-notes-${userId}`)
          if (savedNotes) setNotes(JSON.parse(savedNotes))
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchCustomer()
  }, [userId])

  const addNote = () => {
    if (!note.trim()) return
    const newNotes = [{ text: note.trim(), date: new Date().toISOString() }, ...notes]
    setNotes(newNotes)
    localStorage.setItem(`admin-notes-${userId}`, JSON.stringify(newNotes))
    setNote('')
    toast.success('Note added')
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-(--color-warning)/10 text-(--color-warning)',
      confirmed: 'bg-(--color-info)/10 text-(--color-info)',
      processing: 'bg-(--color-info)/10 text-(--color-info)',
      delivered: 'bg-(--color-success)/10 text-(--color-success)',
      cancelled: 'bg-(--color-error)/10 text-(--color-error)',
    }
    return colors[status] || 'bg-(--color-elevated) text-(--color-text-secondary)'
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" /></div>
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <User className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Customer not found</h2>
        <Link href="/admin/users"><Button variant="outline" className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button></Link>
      </div>
    )
  }

  const c = customer

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-14 w-14 rounded-full bg-(--brand-primary-light) flex items-center justify-center">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-(--brand-primary)">{(c.full_name || c.email).charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{c.full_name || 'Unknown Customer'}</h1>
            <p className="text-sm text-(--color-text-muted) flex items-center gap-3">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>
              {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={c.is_banned ? 'bg-(--color-error)/10 text-(--color-error)' : 'bg-(--color-success)/10 text-(--color-success)'}>
            {c.is_banned ? 'Banned' : 'Active'}
          </Badge>
          <Badge className="bg-(--color-elevated) text-(--color-text-secondary) capitalize">{c.role}</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <ShoppingCart className="h-5 w-5 text-(--brand-primary) mx-auto mb-1" />
          <p className="text-xl font-bold font-mono text-foreground">{c.order_count}</p>
          <p className="text-xs text-(--color-text-muted)">Orders</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <CreditCard className="h-5 w-5 text-(--color-success) mx-auto mb-1" />
          <p className="text-xl font-bold font-mono text-foreground">{formatPrice(c.total_spent)}</p>
          <p className="text-xs text-(--color-text-muted)">Total Spent</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <Star className="h-5 w-5 text-(--brand-amber) mx-auto mb-1" />
          <p className="text-xl font-bold font-mono text-foreground">{c.review_count}</p>
          <p className="text-xs text-(--color-text-muted)">Reviews</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <MapPin className="h-5 w-5 text-(--color-info) mx-auto mb-1" />
          <p className="text-xl font-bold font-mono text-foreground">{c.addresses.length}</p>
          <p className="text-xs text-(--color-text-muted)">Addresses</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <Calendar className="h-5 w-5 text-(--color-text-muted) mx-auto mb-1" />
          <p className="text-sm font-medium text-foreground">{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="text-xs text-(--color-text-muted)">Joined</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order History */}
        <div className="lg:col-span-2 rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
          <div className="px-6 py-4 border-b border-(--color-border) flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Package className="h-5 w-5 text-(--color-text-muted)" /> Order History</h2>
            <span className="text-xs text-(--color-text-muted)">{c.order_count} total</span>
          </div>
          {c.orders.length > 0 ? (
            <div className="divide-y divide-(--color-border)">
              {c.orders.map(order => (
                <div key={order.id} className="px-6 py-3 flex items-center justify-between hover:bg-background transition-colors">
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">{order.order_number}</p>
                    <p className="text-xs text-(--color-text-muted)">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-semibold text-sm text-foreground">{formatPrice(order.total_pence)}</p>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusBadge(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-(--color-text-muted)">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-(--color-text-disabled)" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Addresses */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-(--color-text-muted)" /> Addresses</h2>
            {c.addresses.length > 0 ? (
              <div className="space-y-2">
                {c.addresses.map(addr => (
                  <div key={addr.id} className="p-3 bg-background rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{addr.label || 'Address'}</span>
                      {addr.is_default && <Badge className="bg-(--brand-primary)/10 text-(--brand-primary) text-[10px]">Default</Badge>}
                    </div>
                    <p className="text-(--color-text-muted) text-xs">{addr.address_line_1}, {addr.city}, {addr.postcode}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-(--color-text-muted)">No addresses saved</p>
            )}
          </div>

          {/* Admin Notes (CRM) */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-(--brand-amber)" /> Admin Notes
            </h2>
            <div className="flex gap-2 mb-3">
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Add a note about this customer..."
                className="flex-1 h-9 px-3 border border-(--color-border) rounded-lg text-sm bg-background text-foreground focus:border-(--brand-primary) outline-none"
              />
              <Button size="sm" onClick={addNote} disabled={!note.trim()} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) h-9">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            {notes.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notes.map((n, i) => (
                  <div key={i} className="p-2.5 bg-(--brand-amber)/5 border border-(--brand-amber)/10 rounded-lg">
                    <p className="text-sm text-foreground">{n.text}</p>
                    <p className="text-[10px] text-(--color-text-disabled) mt-1">
                      {new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-(--color-text-muted)">No notes yet. Add internal notes about this customer.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
