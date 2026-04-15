'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ReturnItem {
  id: string
  quantity: number
  refund_amount_pence: number
  product_id: string
  products: { id: string; name: string; image_url: string | null }
}

interface ReturnRequest {
  id: string
  order_id: string
  user_id: string
  reason: string
  reason_detail: string | null
  status: string
  refund_amount_pence: number
  refund_method: string
  admin_notes: string | null
  created_at: string
  orders?: { order_number: string; customer_name: string; customer_email: string }
  return_items?: ReturnItem[]
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  items_received: { label: 'Items Received', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  inspecting: { label: 'Inspecting', color: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
  refund_processing: { label: 'Processing Refund', color: 'bg-cyan-100 text-cyan-800', icon: RotateCcw },
  refunded: { label: 'Refunded', color: 'bg-(--brand-primary-light) text-(--brand-primary)', icon: CheckCircle },
}

export default function VendorReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchReturns = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/vendor/returns?${params}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch returns')
      }
      const data = await res.json()
      setReturns(data.returns || [])
    } catch (err) {
      console.error('Failed to fetch returns:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch returns')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchReturns()
  }, [fetchReturns])

  async function handleUpdateStatus(returnId: string, newStatus: string) {
    setUpdatingId(returnId)
    try {
      const res = await fetch('/api/vendor/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnId, status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update return')
      }
      await fetchReturns()
    } catch (err) {
      console.error('Failed to update return:', err)
      setError(err instanceof Error ? err.message : 'Failed to update return')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatPrice = (pence: number) => `\u00a3${(pence / 100).toFixed(2)}`

  const counts = {
    all: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Returns</h1>
        <p className="text-(--color-text-muted)">Manage return requests for your products</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-(--color-error-bg) border border-(--color-border) rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-(--color-error) shrink-0" />
          <p className="text-sm text-(--color-error)">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-(--color-error)"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-(--color-surface)">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-(--brand-amber-soft) rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-(--brand-amber)" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.pending}</p>
              <p className="text-xs text-(--color-text-muted)">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-(--color-surface)">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-(--color-info)" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.approved}</p>
              <p className="text-xs text-(--color-text-muted)">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-(--color-surface)">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-(--color-error-bg) rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 text-(--color-error)" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.rejected}</p>
              <p className="text-xs text-(--color-text-muted)">Rejected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-(--color-surface)">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-(--color-elevated) rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-(--color-text-secondary)" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.all}</p>
              <p className="text-xs text-(--color-text-muted)">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-(--color-surface)">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
              <Input
                placeholder="Search returns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchReturns()
                }}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  className={statusFilter === s ? 'bg-(--brand-primary) hover:bg-(--brand-primary-hover)' : ''}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  {s !== 'all' && (
                    <span className="ml-1.5 text-xs opacity-75">
                      {counts[s as keyof typeof counts]}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <div className="space-y-3">
        {returns.length === 0 ? (
          <Card className="bg-(--color-surface)">
            <CardContent className="p-12 text-center text-(--color-text-muted)">
              <RotateCcw className="h-12 w-12 mx-auto mb-3 text-(--color-text-disabled)" />
              <p className="text-lg font-medium">No return requests</p>
              <p className="text-sm mt-1">
                {statusFilter !== 'all'
                  ? `No ${statusFilter} returns found for your products.`
                  : 'There are no return requests for your products yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          returns.map((returnReq) => {
            const config = statusConfig[returnReq.status] || statusConfig.pending
            const StatusIcon = config.icon

            return (
              <Card key={returnReq.id} className="bg-(--color-surface)">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Return details */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {returnReq.orders?.order_number || returnReq.order_id.slice(0, 8)}
                        </span>
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-(--color-text-secondary)">
                        <span className="text-(--color-text-muted)">Customer:</span>{' '}
                        {returnReq.orders?.customer_name || 'Unknown'}
                      </p>

                      <p className="text-sm text-(--color-text-secondary)">
                        <span className="text-(--color-text-muted)">Reason:</span>{' '}
                        {returnReq.reason.replace(/_/g, ' ')}
                        {returnReq.reason_detail && (
                          <span className="text-(--color-text-disabled)"> &mdash; {returnReq.reason_detail}</span>
                        )}
                      </p>

                      {/* Products in this return (vendor's products only) */}
                      {returnReq.return_items && returnReq.return_items.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-(--color-text-muted) mb-1">Your products in this return:</p>
                          <div className="flex flex-wrap gap-2">
                            {returnReq.return_items.map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1.5 text-xs bg-background border border-(--color-border) rounded-md px-2 py-1"
                              >
                                {item.products?.name || 'Unknown product'}
                                <span className="text-(--color-text-disabled)">x{item.quantity}</span>
                                {item.refund_amount_pence > 0 && (
                                  <span className="text-(--brand-primary) font-medium">
                                    {formatPrice(item.refund_amount_pence)}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-(--color-text-muted)">
                          Refund: <span className="font-medium text-foreground">{formatPrice(returnReq.refund_amount_pence)}</span>
                          {returnReq.refund_method && (
                            <span className="text-(--color-text-disabled)">
                              {' '}via {returnReq.refund_method.replace(/_/g, ' ')}
                            </span>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-(--color-text-disabled)">
                        Submitted {new Date(returnReq.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>

                      {returnReq.admin_notes && (
                        <p className="text-xs text-(--color-text-muted) bg-background rounded px-2 py-1 mt-1">
                          <span className="font-medium">Notes:</span> {returnReq.admin_notes}
                        </p>
                      )}
                    </div>

                    {/* Actions - only for pending returns */}
                    {returnReq.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
                          onClick={() => handleUpdateStatus(returnReq.id, 'approved')}
                          disabled={updatingId === returnReq.id}
                        >
                          {updatingId === returnReq.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-(--color-border) text-(--color-error) hover:bg-(--color-error-bg) hover:text-(--color-error)"
                          onClick={() => handleUpdateStatus(returnReq.id, 'rejected')}
                          disabled={updatingId === returnReq.id}
                        >
                          {updatingId === returnReq.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
