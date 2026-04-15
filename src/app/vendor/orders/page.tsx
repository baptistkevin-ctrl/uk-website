'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Package,
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  FileText,
  PackageCheck,
  Cog,
  ArrowRight
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils/format'

interface VendorOrder {
  id: string
  order_id: string
  order_number: string
  status: string
  total_amount: number
  commission_amount: number
  vendor_amount: number
  created_at: string
  order: {
    customer_name: string
    customer_email: string
    customer_phone?: string
    delivery_address?: string
    delivery_city?: string
    delivery_postcode: string
    status: string
  }
  items: {
    id: string
    product_name: string
    quantity: number
    unit_price_pence: number
  }[]
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/vendor/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Fetch orders error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_order_id: orderId, status: newStatus })
      })

      if (res.ok) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        )
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
        toast.success(`Order marked as ${newStatus}`)
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Update status error:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handlePrintInvoice = () => {
    setShowInvoice(true)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const filteredOrders = orders.filter(order => {
    const searchLower = search.toLowerCase()
    return (
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.order?.customer_name?.toLowerCase().includes(searchLower) ||
      order.order?.customer_email?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-(--color-warning-bg) text-(--color-warning)',
      pending_payout: 'bg-(--color-warning-bg) text-(--brand-amber)',
      transferred: 'bg-(--brand-primary-light) text-(--brand-primary)',
      confirmed: 'bg-(--color-info-bg) text-(--color-info)',
      processing: 'bg-(--color-info-bg) text-(--color-info)',
      shipped: 'bg-(--color-info-bg) text-(--color-info)',
      delivered: 'bg-(--brand-primary-light) text-(--brand-primary)',
      cancelled: 'bg-(--color-error-bg) text-(--color-error)',
    }
    const labels: Record<string, string> = {
      pending_payout: 'Pending Payout',
      transferred: 'Paid',
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status] || 'bg-(--color-elevated) text-foreground'}`}>
        {labels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'transferred': return <CheckCircle className="h-5 w-5 text-(--brand-primary)" />
      case 'delivered': return <CheckCircle className="h-5 w-5 text-(--brand-primary)" />
      case 'shipped': return <Truck className="h-5 w-5 text-indigo-500" />
      case 'cancelled': return <XCircle className="h-5 w-5 text-(--color-error)" />
      default: return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <>
      {/* Print Invoice Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-invoice, .print-invoice * {
            visibility: visible;
          }
          .print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="p-6 lg:p-8 no-print">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-(--color-text-secondary)">{orders.length} total orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-(--color-surface) rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="transferred">Paid</option>
              <option value="pending_payout">Pending Payout</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-(--color-surface) rounded-xl shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No orders found</h3>
              <p className="text-(--color-text-muted)">Orders will appear here when customers purchase your products</p>
            </div>
          ) : (
            <div className="divide-y divide-(--color-border)">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 hover:bg-background cursor-pointer transition-colors"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-(--color-elevated) rounded-lg flex items-center justify-center">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">#{order.order_number}</p>
                        <p className="text-sm text-(--color-text-muted)">{order.order?.customer_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatPrice(order.vendor_amount)}</p>
                      <div className="mt-1">{getStatusBadge(order.status)}</div>
                    </div>
                  </div>
                  {/* Mini milestone progress bar */}
                  {order.status !== 'cancelled' && (
                    <div className="mt-3 flex items-center gap-1">
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, i) => {
                        const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
                        const currentIdx = statusOrder.indexOf(order.status)
                        const stepIdx = statusOrder.indexOf(step)
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`h-1.5 w-full rounded-full ${
                              stepIdx <= currentIdx ? 'bg-(--brand-primary)' : 'bg-(--color-border)'
                            }`} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-sm text-(--color-text-muted)">
                    <span>{new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                    <span>{order.items?.length || 0} items</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-(--color-surface) rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-(--color-surface) z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Order #{selectedOrder.order_number}</h2>
                    <p className="text-(--color-text-muted)">{new Date(selectedOrder.created_at).toLocaleString('en-GB')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Print Invoice Button */}
                    <Button
                      onClick={handlePrintInvoice}
                      className="bg-(--color-info) hover:bg-(--color-info) text-white"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Invoice
                    </Button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 hover:bg-(--color-elevated) rounded-lg"
                    >
                      <XCircle className="h-5 w-5 text-(--color-text-muted)" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Customer</h3>
                  <div className="bg-background rounded-lg p-4">
                    <p className="font-medium text-foreground">{selectedOrder.order?.customer_name}</p>
                    <p className="text-sm text-(--color-text-muted)">{selectedOrder.order?.customer_email}</p>
                    {selectedOrder.order?.customer_phone && (
                      <p className="text-sm text-(--color-text-muted)">{selectedOrder.order.customer_phone}</p>
                    )}
                    <p className="text-sm text-(--color-text-muted) mt-2">
                      <strong>Delivery:</strong><br />
                      {selectedOrder.order?.delivery_address && `${selectedOrder.order.delivery_address}, `}
                      {selectedOrder.order?.delivery_city && `${selectedOrder.order.delivery_city}, `}
                      {selectedOrder.order?.delivery_postcode}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{item.product_name}</p>
                          <p className="text-sm text-(--color-text-muted)">Qty: {item.quantity} x {formatPrice(item.unit_price_pence)}</p>
                        </div>
                        <p className="font-medium text-foreground">
                          {formatPrice(item.unit_price_pence * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Summary</h3>
                  <div className="bg-background rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-(--color-text-muted)">Order Total</span>
                      <span className="font-medium">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-(--color-text-muted)">Platform Commission</span>
                      <span className="font-medium text-(--color-error)">-{formatPrice(selectedOrder.commission_amount)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold text-foreground">Your Earnings</span>
                      <span className="font-bold text-(--brand-primary)">{formatPrice(selectedOrder.vendor_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Milestone Tracker */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Order Progress</h3>
                  {selectedOrder.status === 'cancelled' ? (
                    <div className="bg-(--color-error-bg) border border-(--color-border) rounded-xl p-4 flex items-center gap-3">
                      <XCircle className="h-6 w-6 text-(--color-error)" />
                      <div>
                        <p className="font-semibold text-(--color-error)">Order Cancelled</p>
                        <p className="text-sm text-(--color-error)">This order has been cancelled and cannot be updated.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Milestone Steps */}
                      {(() => {
                        const milestones = [
                          { key: 'pending', label: 'Order Received', icon: Clock, description: 'Customer placed the order' },
                          { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Vendor confirmed the order' },
                          { key: 'processing', label: 'Processing', icon: Cog, description: 'Order is being prepared' },
                          { key: 'shipped', label: 'Shipped', icon: Truck, description: 'Order dispatched for delivery' },
                          { key: 'delivered', label: 'Delivered', icon: PackageCheck, description: 'Order delivered to customer' },
                        ]
                        const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
                        const currentIndex = statusOrder.indexOf(selectedOrder.status)
                        const nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null

                        return (
                          <div className="space-y-0">
                            {milestones.map((milestone, index) => {
                              const milestoneIndex = statusOrder.indexOf(milestone.key)
                              const isCompleted = milestoneIndex <= currentIndex
                              const isCurrent = milestoneIndex === currentIndex
                              const isNext = milestoneIndex === currentIndex + 1
                              const MilestoneIcon = milestone.icon

                              return (
                                <div key={milestone.key}>
                                  <div className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                                    isCurrent ? 'bg-(--brand-primary-light) border border-(--brand-primary)/20' :
                                    isNext ? 'bg-(--color-info-bg)/50 border border-blue-100' :
                                    ''
                                  }`}>
                                    {/* Step indicator */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                      isCompleted ? 'bg-(--brand-primary) text-white' :
                                      isNext ? 'bg-(--color-info-bg) text-(--color-info) border-2 border-(--color-border)' :
                                      'bg-(--color-elevated) text-(--color-text-disabled)'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle className="h-5 w-5" />
                                      ) : (
                                        <MilestoneIcon className="h-5 w-5" />
                                      )}
                                    </div>

                                    {/* Step content */}
                                    <div className="flex-1">
                                      <p className={`font-semibold text-sm ${
                                        isCompleted ? 'text-(--brand-primary)' :
                                        isNext ? 'text-(--color-info)' :
                                        'text-(--color-text-disabled)'
                                      }`}>
                                        {milestone.label}
                                        {isCurrent && (
                                          <span className="ml-2 text-xs bg-(--brand-primary-light) text-(--brand-primary) px-2 py-0.5 rounded-full">
                                            Current
                                          </span>
                                        )}
                                      </p>
                                      <p className={`text-xs ${
                                        isCompleted ? 'text-(--brand-primary)' :
                                        isNext ? 'text-(--color-info)' :
                                        'text-(--color-text-disabled)'
                                      }`}>
                                        {milestone.description}
                                      </p>
                                    </div>

                                    {/* Action button for next step */}
                                    {isNext && (
                                      <Button
                                        size="sm"
                                        onClick={() => updateOrderStatus(selectedOrder.id, milestone.key)}
                                        disabled={updatingStatus === selectedOrder.id}
                                        className="bg-(--color-info) hover:bg-(--color-info) text-white shrink-0"
                                      >
                                        {updatingStatus === selectedOrder.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <>
                                            Mark as {milestone.label}
                                            <ArrowRight className="h-4 w-4 ml-1" />
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>

                                  {/* Connector line */}
                                  {index < milestones.length - 1 && (
                                    <div className="ml-[1.15rem] h-4 flex items-center">
                                      <div className={`w-0.5 h-full ${
                                        milestoneIndex < currentIndex ? 'bg-(--brand-primary)' : 'bg-(--color-border)'
                                      }`} />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}

                      {/* Cancel Order Button */}
                      {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'shipped' && (
                        <div className="mt-4 pt-4 border-t border-(--color-border)">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this order?')) {
                                updateOrderStatus(selectedOrder.id, 'cancelled')
                              }
                            }}
                            disabled={updatingStatus === selectedOrder.id}
                            className="text-(--color-error) border-(--color-border) hover:bg-(--color-error-bg)"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel Order
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Invoice */}
      {selectedOrder && (
        <div ref={invoiceRef} className="print-invoice hidden print:block">
          <div className="max-w-3xl mx-auto p-8 bg-(--color-surface)">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-(--color-border)">
              <div>
                <h1 className="text-3xl font-bold text-foreground">INVOICE</h1>
                <p className="text-(--color-text-muted) mt-1">#{selectedOrder.order_number}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-(--brand-primary)">UK Grocery</h2>
                <p className="text-sm text-(--color-text-muted)">UK Grocery Store</p>
                <p className="text-sm text-(--color-text-muted)">VAT: GB123456789</p>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-(--color-text-muted) uppercase mb-2">Bill To</h3>
                <p className="font-semibold text-foreground">{selectedOrder.order?.customer_name}</p>
                <p className="text-sm text-(--color-text-secondary)">{selectedOrder.order?.customer_email}</p>
                {selectedOrder.order?.customer_phone && (
                  <p className="text-sm text-(--color-text-secondary)">{selectedOrder.order.customer_phone}</p>
                )}
                <p className="text-sm text-(--color-text-secondary) mt-2">
                  {selectedOrder.order?.delivery_address && `${selectedOrder.order.delivery_address}`}<br />
                  {selectedOrder.order?.delivery_city && `${selectedOrder.order.delivery_city}`}<br />
                  {selectedOrder.order?.delivery_postcode}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-semibold text-(--color-text-muted) uppercase mb-2">Invoice Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-(--color-text-muted)">Invoice Date:</span> <span className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString('en-GB')}</span></p>
                  <p><span className="text-(--color-text-muted)">Order Date:</span> <span className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString('en-GB')}</span></p>
                  <p><span className="text-(--color-text-muted)">Status:</span> <span className="font-medium capitalize">{selectedOrder.status}</span></p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-(--color-border)">
                  <th className="text-left py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Item</th>
                  <th className="text-center py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Qty</th>
                  <th className="text-right py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Unit Price</th>
                  <th className="text-right py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : ''}>
                    <td className="py-3 px-2 text-sm text-foreground">{item.product_name}</td>
                    <td className="py-3 px-2 text-sm text-(--color-text-secondary) text-center">{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-(--color-text-secondary) text-right">{formatPrice(item.unit_price_pence)}</td>
                    <td className="py-3 px-2 text-sm font-medium text-foreground text-right">{formatPrice(item.unit_price_pence * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t-2 border-(--color-border) pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-(--color-text-muted)">Subtotal</span>
                    <span className="font-medium">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--color-text-muted)">Delivery</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--color-text-muted)">VAT (20%)</span>
                    <span className="font-medium">{formatPrice(Math.round(selectedOrder.total_amount * 0.2))}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-(--color-border)">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-xl text-foreground">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-(--color-border) text-center text-sm text-(--color-text-muted)">
              <p>Thank you for your order!</p>
              <p className="mt-2">For questions, contact support@ukgrocerystore.com</p>
              <p className="mt-4 text-xs">This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
