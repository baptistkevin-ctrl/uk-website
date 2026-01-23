'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Search,
  Eye,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertCircle,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  delivery_address_line_1: string
  delivery_city: string
  delivery_postcode: string
  subtotal_pence: number
  delivery_fee_pence: number
  discount_pence: number
  total_pence: number
  status: string
  payment_status: string
  created_at: string
  delivery_date: string | null
  delivery_time_start: string | null
  delivery_time_end: string | null
}

const ORDER_STATUSES = [
  { value: 'all', label: 'All Orders', icon: Package },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { value: 'processing', label: 'Processing', icon: RefreshCw },
  { value: 'ready_for_delivery', label: 'Ready', icon: Package },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
]

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const ordersPerPage = 50
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ordersPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentFilter !== 'all' && { paymentStatus: paymentFilter }),
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()

      if (data.orders) {
        setOrders(data.orders)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, paymentFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchOrders()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Clear selection when page or filters change
  useEffect(() => {
    setSelectedOrders(new Set())
  }, [page, statusFilter, paymentFilter])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700'
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'processing': return 'bg-yellow-100 text-yellow-700'
      case 'ready_for_delivery': return 'bg-purple-100 text-purple-700'
      case 'out_for_delivery': return 'bg-orange-100 text-orange-700'
      case 'delivered': return 'bg-emerald-100 text-emerald-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
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

  const getNextStatus = (currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'processing',
      processing: 'ready_for_delivery',
      ready_for_delivery: 'out_for_delivery',
      out_for_delivery: 'delivered',
    }
    return statusFlow[currentStatus]
  }

  // Toggle single order selection
  const toggleOrderSelection = (id: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Select/deselect all orders on current page
  const toggleSelectAll = () => {
    const pageIds = orders.map(o => o.id)
    const allSelected = pageIds.every(id => selectedOrders.has(id))

    if (allSelected) {
      setSelectedOrders(prev => {
        const newSet = new Set(prev)
        pageIds.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      setSelectedOrders(prev => {
        const newSet = new Set(prev)
        pageIds.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  // Check if all on current page are selected
  const isAllPageSelected = orders.length > 0 && orders.every(o => selectedOrders.has(o.id))

  // Bulk delete selected orders
  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)? This action cannot be undone.`)) return

    setBulkDeleting(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedOrders) {
      try {
        const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    setSelectedOrders(new Set())
    setBulkDeleting(false)
    fetchOrders()

    alert(`Deleted ${successCount} order(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
      }
    }
    return pages
  }

  // Count orders by status
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-emerald-600" />
            Orders
          </h1>
          <p className="text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out for Delivery</p>
              <p className="text-2xl font-bold text-orange-600">
                {orders.filter(o => o.status === 'out_for_delivery').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-emerald-600">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by order number, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              {ORDER_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Payments</option>
              {PAYMENT_STATUSES.slice(1).map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedOrders.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-emerald-800">
            <span className="font-semibold">{selectedOrders.size}</span> order(s) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="gap-2"
          >
            {bulkDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Selected
          </Button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Orders will appear here when customers make purchases'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedOrders.has(order.id) ? 'bg-emerald-50' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{order.order_number}</p>
                        {order.delivery_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Delivery: {new Date(order.delivery_date).toLocaleDateString('en-GB')}
                            {order.delivery_time_start && ` ${order.delivery_time_start.slice(0, 5)}`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{formatPrice(order.total_pence)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentColor(order.payment_status)}`}>
                        {order.payment_status === 'paid' && <CheckCircle className="h-3 w-3" />}
                        {order.payment_status === 'pending' && <Clock className="h-3 w-3" />}
                        {order.payment_status === 'failed' && <AlertCircle className="h-3 w-3" />}
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        {getNextStatus(order.status) && order.status !== 'cancelled' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                            disabled={updatingStatus === order.id}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                            title={`Mark as ${getNextStatus(order.status).replace(/_/g, ' ')}`}
                          >
                            {updatingStatus === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Showing info */}
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{((page - 1) * ordersPerPage) + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(page * ordersPerPage, total)}</span> of{' '}
              <span className="font-semibold text-gray-900">{total}</span> orders
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => (
                  <button
                    key={index}
                    onClick={() => typeof pageNum === 'number' && setPage(pageNum)}
                    disabled={pageNum === '...'}
                    className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-lg transition-colors ${
                      pageNum === page
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                        : pageNum === '...'
                        ? 'bg-transparent text-gray-400 cursor-default'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden text-sm font-medium text-gray-600">
                Page {page} of {totalPages}
              </div>

              {/* Next button */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:hover:bg-gray-100"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
