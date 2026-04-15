'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  Truck,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  items_received: { label: 'Items Received', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  inspecting: { label: 'Inspecting', color: 'bg-purple-100 text-purple-800', icon: Eye },
  refund_processing: { label: 'Processing Refund', color: 'bg-cyan-100 text-cyan-800', icon: RotateCcw },
  refunded: { label: 'Refunded', color: 'bg-(--brand-primary-light) text-(--brand-primary)', icon: CheckCircle },
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchReturns()
  }, [statusFilter])

  async function fetchReturns() {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/returns?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReturns(data.returns || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(returnId: string, newStatus: string) {
    setUpdatingId(returnId)
    try {
      const res = await fetch('/api/admin/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnId, status: newStatus }),
      })
      if (res.ok) {
        fetchReturns()
      }
    } catch (error) {
      console.error('Failed to update return:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  const counts = {
    all: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    refunded: returns.filter(r => r.status === 'refunded').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Returns Management</h1>
        <p className="text-(--color-text-muted)">Process and manage customer return requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
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
        <Card>
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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-(--brand-primary)" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.refunded}</p>
              <p className="text-xs text-(--color-text-muted)">Refunded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
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
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
          <Input
            placeholder="Search by order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReturns()}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'items_received', 'refunded'].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </div>
      </div>

      {/* Returns List */}
      <div className="space-y-3">
        {returns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-(--color-text-muted)">
              <RotateCcw className="h-12 w-12 mx-auto mb-3 text-(--color-text-disabled)" />
              <p>No return requests found</p>
            </CardContent>
          </Card>
        ) : (
          returns.map((returnReq) => {
            const config = statusConfig[returnReq.status] || statusConfig.pending
            const StatusIcon = config.icon

            return (
              <Card key={returnReq.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {returnReq.orders?.order_number || returnReq.order_id.slice(0, 8)}
                        </span>
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-(--color-text-muted)">
                        {returnReq.orders?.customer_name} ({returnReq.orders?.customer_email})
                      </p>
                      <p className="text-sm">
                        <span className="text-(--color-text-muted)">Reason:</span>{' '}
                        {returnReq.reason.replace(/_/g, ' ')}
                        {returnReq.reason_detail && ` - ${returnReq.reason_detail}`}
                      </p>
                      <p className="text-sm text-(--color-text-muted)">
                        Refund: {formatPrice(returnReq.refund_amount_pence)} via {returnReq.refund_method?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-(--color-text-disabled)">
                        Submitted {new Date(returnReq.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {returnReq.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
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
                            onClick={() => handleUpdateStatus(returnReq.id, 'rejected')}
                            disabled={updatingId === returnReq.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {returnReq.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(returnReq.id, 'items_received')}
                          disabled={updatingId === returnReq.id}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Mark Received
                        </Button>
                      )}
                      {returnReq.status === 'items_received' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(returnReq.id, 'refund_processing')}
                          disabled={updatingId === returnReq.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Process Refund
                        </Button>
                      )}
                      {returnReq.status === 'refund_processing' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(returnReq.id, 'refunded')}
                          disabled={updatingId === returnReq.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Refunded
                        </Button>
                      )}
                    </div>
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
