'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price_pence: number
  product?: { name: string; slug: string; image_url: string | null }
}

interface Order {
  id: string
  order_number: string
  status: string
  total_pence: number
  created_at: string
  delivered_at: string | null
  order_items: OrderItem[]
}

const returnReasons = [
  { value: 'damaged', label: 'Damaged item' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'expired', label: 'Expired product' },
  { value: 'missing_items', label: 'Missing items' },
  { value: 'other', label: 'Other reason' },
]

const refundMethods = [
  { value: 'original_payment', label: 'Refund to original payment method' },
  { value: 'store_credit', label: 'Store credit (instant)' },
]

export default function NewReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [reasonDetails, setReasonDetails] = useState('')
  const [refundMethod, setRefundMethod] = useState('original_payment')

  useEffect(() => {
    if (orderId) fetchOrder()
    else setLoading(false)
  }, [orderId])

  async function fetchOrder() {
    try {
      // Fetch the specific order to get its items
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order || data)
      } else {
        setError('Order not found or not eligible for return')
      }
    } catch {
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  function toggleItem(itemId: string, maxQty: number) {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: maxQty }
    })
  }

  function updateItemQty(itemId: string, qty: number) {
    setSelectedItems((prev) => ({ ...prev, [itemId]: qty }))
  }

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const selectedCount = Object.keys(selectedItems).length
  const estimatedRefund = order?.order_items
    ? Object.entries(selectedItems).reduce((total, [itemId, qty]) => {
        const item = order.order_items.find((i) => i.id === itemId)
        if (!item) return total
        return total + Math.round((item.unit_price_pence * qty))
      }, 0)
    : 0

  async function handleSubmit() {
    if (!orderId || selectedCount === 0 || !reason) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          reason,
          reason_details: reasonDetails || undefined,
          refund_method: refundMethod,
          items: Object.entries(selectedItems).map(([order_item_id, quantity]) => ({
            order_item_id,
            quantity,
          })),
        }),
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit return request')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Return Request Submitted</h2>
        <p className="text-gray-500">
          We&apos;ve received your return request and will review it within 1-2 business days.
          You&apos;ll receive an email with further instructions.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button asChild>
            <Link href="/account/returns">View My Returns</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!orderId) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">No order specified. Please start a return from your order details page.</p>
        <Button asChild>
          <Link href="/account/orders">Go to Orders</Link>
        </Button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
        <Button asChild>
          <Link href="/account/orders">Go to Orders</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/account/orders/${orderId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Return</h1>
          <p className="text-gray-500">Order {order.order_number}</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Select items */}
      <Card>
        <CardHeader>
          <CardTitle>Select items to return</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.order_items?.map((item) => {
            const isSelected = !!selectedItems[item.id]
            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleItem(item.id, item.quantity)}
              >
                <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0">
                  {isSelected && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product?.name || item.product_name}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.unit_price_pence)} each</p>
                </div>
                {isSelected && item.quantity > 1 && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Label className="text-xs text-gray-500">Qty:</Label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedItems[item.id]}
                      onChange={(e) => updateItemQty(item.id, parseInt(e.target.value))}
                    >
                      {Array.from({ length: item.quantity }, (_, i) => i + 1).map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Reason */}
      <Card>
        <CardHeader>
          <CardTitle>Reason for return</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {returnReasons.map((r) => (
              <button
                key={r.value}
                className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                  reason === r.value
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                onClick={() => setReason(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div>
            <Label className="text-sm text-gray-600">Additional details (optional)</Label>
            <textarea
              className="w-full mt-1 rounded-lg border border-gray-200 p-3 text-sm min-h-[80px]"
              placeholder="Please describe the issue..."
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              maxLength={2000}
            />
          </div>
        </CardContent>
      </Card>

      {/* Refund method */}
      <Card>
        <CardHeader>
          <CardTitle>Refund method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {refundMethods.map((m) => (
            <label
              key={m.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                refundMethod === m.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="refundMethod"
                value={m.value}
                checked={refundMethod === m.value}
                onChange={() => setRefundMethod(m.value)}
                className="accent-green-600"
              />
              <span className="text-sm">{m.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Summary & Submit */}
      <Card className="border-green-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Items selected</span>
            <span className="font-medium">{selectedCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Estimated refund</span>
            <span className="font-medium text-green-700">{formatPrice(estimatedRefund)}</span>
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || selectedCount === 0 || !reason}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Submit Return Request
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Returns are typically processed within 3-5 business days after items are received.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
