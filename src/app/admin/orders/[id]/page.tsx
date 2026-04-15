'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Phone,
  Mail,
  FileText,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_sku: string | null
  product_image_url: string | null
  quantity: number
  unit_price_pence: number
  total_price_pence: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  delivery_address_line_1: string
  delivery_address_line_2: string | null
  delivery_city: string
  delivery_county: string | null
  delivery_postcode: string
  delivery_instructions: string | null
  delivery_date: string | null
  delivery_time_start: string | null
  delivery_time_end: string | null
  subtotal_pence: number
  delivery_fee_pence: number
  discount_pence: number
  total_pence: number
  status: string
  payment_status: string
  notes: string | null
  created_at: string
  paid_at: string | null
  confirmed_at: string | null
  dispatched_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  items: OrderItem[]
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready_for_delivery', label: 'Ready for Delivery' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState('')

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`)
      if (!response.ok) throw new Error('Order not found')
      const data = await response.json()
      setOrder(data)
      setNotes(data.notes || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  const updateStatus = async (newStatus: string) => {
    if (!order) return
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      })
      if (response.ok) {
        fetchOrder()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const saveNotes = async () => {
    if (!order) return
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, notes }),
      })
      if (response.ok) {
        fetchOrder()
      }
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setUpdating(false)
    }
  }

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-(--color-elevated) text-foreground border-(--color-border)'
      case 'confirmed': return 'bg-(--color-info-bg) text-(--color-info) border-(--color-border)'
      case 'processing': return 'bg-(--color-warning-bg) text-(--color-warning) border-(--color-border)'
      case 'ready_for_delivery': return 'bg-(--color-info-bg) text-(--color-info) border-(--color-border)'
      case 'out_for_delivery': return 'bg-(--color-warning-bg) text-(--brand-amber) border-(--color-border)'
      case 'delivered': return 'bg-(--brand-primary-light) text-(--brand-primary) border-(--brand-primary)/20'
      case 'cancelled': return 'bg-(--color-error-bg) text-(--color-error) border-(--color-border)'
      default: return 'bg-(--color-elevated) text-foreground border-(--color-border)'
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-(--brand-primary-light) text-(--brand-primary)'
      case 'pending': return 'bg-(--color-warning-bg) text-(--color-warning)'
      case 'failed': return 'bg-(--color-error-bg) text-(--color-error)'
      case 'refunded': return 'bg-(--color-elevated) text-foreground'
      default: return 'bg-(--color-elevated) text-foreground'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-foreground mb-2">Error</h2>
        <p className="text-(--color-text-muted) mb-6">{error || 'Order not found'}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-(--color-text-secondary) hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Package className="h-7 w-7 text-(--brand-primary)" />
            Order {order.order_number}
          </h1>
          <p className="text-(--color-text-muted) mt-1">Placed on {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2.5 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getPaymentColor(order.payment_status)}`}>
            {order.payment_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden">
            <div className="px-6 py-4 border-b border-(--color-border)">
              <h2 className="text-lg font-semibold text-foreground">Order Items</h2>
            </div>
            <div className="divide-y divide-(--color-border)">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-(--color-elevated) rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {item.product_image_url ? (
                        <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-(--color-text-disabled)" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      {item.product_sku && (
                        <p className="text-sm text-(--color-text-muted)">SKU: {item.product_sku}</p>
                      )}
                      <p className="text-sm text-(--color-text-muted)">Qty: {item.quantity} × {formatPrice(item.unit_price_pence)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatPrice(item.total_price_pence)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-(--color-text-muted)">
                  No items found for this order
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-background border-t border-(--color-border)">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-(--color-text-muted)">Subtotal</span>
                  <span>{formatPrice(order.subtotal_pence)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-(--color-text-muted)">Delivery</span>
                  <span>{formatPrice(order.delivery_fee_pence)}</span>
                </div>
                {order.discount_pence > 0 && (
                  <div className="flex justify-between text-sm text-(--brand-primary)">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_pence)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-(--color-border)">
                  <span>Total</span>
                  <span>{formatPrice(order.total_pence)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {[
                { label: 'Order Placed', time: order.created_at, icon: Clock },
                { label: 'Payment Received', time: order.paid_at, icon: CreditCard },
                { label: 'Order Confirmed', time: order.confirmed_at, icon: CheckCircle },
                { label: 'Dispatched', time: order.dispatched_at, icon: Truck },
                { label: 'Delivered', time: order.delivered_at, icon: CheckCircle },
                ...(order.cancelled_at ? [{ label: 'Cancelled', time: order.cancelled_at, icon: XCircle }] : []),
              ].map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${event.time ? 'bg-(--brand-primary-light)' : 'bg-(--color-elevated)'}`}>
                    <event.icon className={`h-4 w-4 ${event.time ? 'text-(--brand-primary)' : 'text-(--color-text-disabled)'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${event.time ? 'text-foreground' : 'text-(--color-text-disabled)'}`}>
                      {event.label}
                    </p>
                    <p className="text-sm text-(--color-text-muted)">
                      {event.time ? formatDateTime(event.time) : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-(--color-text-disabled)" />
              Order Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this order..."
              rows={3}
              className="w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) text-sm"
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={saveNotes}
                disabled={updating || notes === (order.notes || '')}
                className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Notes'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Update Status</h2>
            <div className="space-y-2">
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => updateStatus(status.value)}
                  disabled={updating || order.status === status.value}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    order.status === status.value
                      ? getStatusColor(status.value).replace('border-', 'border ')
                      : 'bg-background text-foreground hover:bg-(--color-elevated) border border-(--color-border)'
                  } disabled:opacity-50`}
                >
                  {status.label}
                  {order.status === status.value && (
                    <span className="ml-2 text-xs">(Current)</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-(--color-text-disabled)" />
              Customer
            </h2>
            <div className="space-y-3">
              <p className="font-medium text-foreground">{order.customer_name}</p>
              <div className="flex items-center gap-2 text-sm text-(--color-text-secondary)">
                <Mail className="h-4 w-4 text-(--color-text-disabled)" />
                <a href={`mailto:${order.customer_email}`} className="hover:text-(--brand-primary)">
                  {order.customer_email}
                </a>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-sm text-(--color-text-secondary)">
                  <Phone className="h-4 w-4 text-(--color-text-disabled)" />
                  <a href={`tel:${order.customer_phone}`} className="hover:text-(--brand-primary)">
                    {order.customer_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-(--color-text-disabled)" />
              Delivery Address
            </h2>
            <div className="text-sm text-(--color-text-secondary) space-y-1">
              <p>{order.delivery_address_line_1}</p>
              {order.delivery_address_line_2 && <p>{order.delivery_address_line_2}</p>}
              <p>{order.delivery_city}</p>
              {order.delivery_county && <p>{order.delivery_county}</p>}
              <p className="font-medium">{order.delivery_postcode}</p>
            </div>
            {order.delivery_instructions && (
              <div className="mt-4 pt-4 border-t border-(--color-border)">
                <p className="text-xs text-(--color-text-muted) uppercase font-medium mb-1">Delivery Instructions</p>
                <p className="text-sm text-(--color-text-secondary)">{order.delivery_instructions}</p>
              </div>
            )}
          </div>

          {/* Delivery Slot */}
          {order.delivery_date && (
            <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-(--color-text-disabled)" />
                Delivery Slot
              </h2>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {new Date(order.delivery_date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {order.delivery_time_start && order.delivery_time_end && (
                  <p className="text-(--color-text-secondary) mt-1">
                    {order.delivery_time_start.slice(0, 5)} - {order.delivery_time_end.slice(0, 5)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
