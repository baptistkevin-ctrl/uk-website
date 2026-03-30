'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  RotateCcw,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ReturnItem {
  id: string
  quantity: number
  refund_amount_pence: number
  products: { name: string; image_url: string | null }
}

interface ReturnRequest {
  id: string
  order_id: string
  reason: string
  reason_details: string | null
  status: string
  refund_amount_pence: number
  refund_method: string
  created_at: string
  orders: { order_number: string; total_pence: number; created_at: string }
  return_items: ReturnItem[]
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  items_received: { label: 'Items Received', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  inspecting: { label: 'Inspecting', color: 'bg-purple-100 text-purple-800', icon: Eye },
  refund_processing: { label: 'Processing Refund', color: 'bg-cyan-100 text-cyan-800', icon: RotateCcw },
  refunded: { label: 'Refunded', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

const reasonLabels: Record<string, string> = {
  damaged: 'Damaged item',
  wrong_item: 'Wrong item received',
  not_as_described: 'Not as described',
  quality_issue: 'Quality issue',
  changed_mind: 'Changed my mind',
  expired: 'Expired product',
  missing_items: 'Missing items',
  other: 'Other',
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    fetchReturns()
  }, [statusFilter])

  async function fetchReturns() {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/returns?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReturns(data.returns || [])
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(returnId: string) {
    if (!confirm('Are you sure you want to cancel this return request?')) return
    setCancelling(returnId)
    try {
      const res = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (res.ok) {
        fetchReturns()
      }
    } catch (error) {
      console.error('Failed to cancel return:', error)
    } finally {
      setCancelling(null)
    }
  }

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Returns</h1>
        <p className="text-gray-500">Track and manage your return requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: null, label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'refunded', label: 'Refunded' },
        ].map((tab) => (
          <Button
            key={tab.label}
            size="sm"
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Returns list */}
      {returns.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">No return requests found</p>
            <Link href="/account/orders">
              <Button variant="outline" size="sm">
                <Package className="h-4 w-4 mr-2" />
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => {
            const config = statusConfig[ret.status] || statusConfig.pending
            const StatusIcon = config.icon

            return (
              <Card key={ret.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/account/orders/${ret.order_id}`}
                          className="font-medium text-green-700 hover:underline"
                        >
                          Order {ret.orders?.order_number || ret.order_id.slice(0, 8)}
                        </Link>
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      {/* Reason */}
                      <p className="text-sm text-gray-600">
                        <span className="text-gray-500">Reason:</span>{' '}
                        {reasonLabels[ret.reason] || ret.reason}
                        {ret.reason_details && (
                          <span className="text-gray-400"> — {ret.reason_details}</span>
                        )}
                      </p>

                      {/* Items */}
                      {ret.return_items && ret.return_items.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {ret.return_items.map((item) => (
                            <span
                              key={item.id}
                              className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-600"
                            >
                              {item.products?.name || 'Item'} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer info */}
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>Refund: {formatPrice(ret.refund_amount_pence)}</span>
                        <span>Method: {ret.refund_method?.replace(/_/g, ' ')}</span>
                        <span>Submitted {new Date(ret.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {ret.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(ret.id)}
                          disabled={cancelling === ret.id}
                        >
                          {cancelling === ret.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Help text */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Return Policy</p>
            <p>
              Items can be returned within 30 days of delivery. To start a return, go to your{' '}
              <Link href="/account/orders" className="underline font-medium">
                order details
              </Link>{' '}
              and click &quot;Request Return&quot; on an eligible order.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
