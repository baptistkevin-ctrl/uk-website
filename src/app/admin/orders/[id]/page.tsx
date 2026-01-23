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
      case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'ready_for_delivery': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'out_for_delivery': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'refunded': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500 mb-6">{error || 'Order not found'}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-7 w-7 text-emerald-600" />
            Order {order.order_number}
          </h1>
          <p className="text-gray-500 mt-1">Placed on {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product_image_url ? (
                        <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      {item.product_sku && (
                        <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatPrice(item.unit_price_pence)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(item.total_price_pence)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No items found for this order
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(order.subtotal_pence)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span>{formatPrice(order.delivery_fee_pence)}</span>
                </div>
                {order.discount_pence > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_pence)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(order.total_pence)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
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
                  <div className={`p-2 rounded-full ${event.time ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    <event.icon className={`h-4 w-4 ${event.time ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${event.time ? 'text-gray-900' : 'text-gray-400'}`}>
                      {event.label}
                    </p>
                    <p className="text-sm text-gray-500">
                      {event.time ? formatDateTime(event.time) : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              Order Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this order..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={saveNotes}
                disabled={updating || notes === (order.notes || '')}
                className="bg-emerald-600 hover:bg-emerald-700"
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
            <div className="space-y-2">
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => updateStatus(status.value)}
                  disabled={updating || order.status === status.value}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    order.status === status.value
                      ? getStatusColor(status.value).replace('border-', 'border ')
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              Customer
            </h2>
            <div className="space-y-3">
              <p className="font-medium text-gray-900">{order.customer_name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${order.customer_email}`} className="hover:text-emerald-600">
                  {order.customer_email}
                </a>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${order.customer_phone}`} className="hover:text-emerald-600">
                    {order.customer_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              Delivery Address
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.delivery_address_line_1}</p>
              {order.delivery_address_line_2 && <p>{order.delivery_address_line_2}</p>}
              <p>{order.delivery_city}</p>
              {order.delivery_county && <p>{order.delivery_county}</p>}
              <p className="font-medium">{order.delivery_postcode}</p>
            </div>
            {order.delivery_instructions && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Delivery Instructions</p>
                <p className="text-sm text-gray-600">{order.delivery_instructions}</p>
              </div>
            )}
          </div>

          {/* Delivery Slot */}
          {order.delivery_date && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                Delivery Slot
              </h2>
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {new Date(order.delivery_date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {order.delivery_time_start && order.delivery_time_end && (
                  <p className="text-gray-600 mt-1">
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
