'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRightLeft,
  Search,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  PoundSterling,
  TrendingUp,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Transaction {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_pence: number
  subtotal_pence: number
  delivery_fee_pence: number
  discount_pence: number
  payment_status: string
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  paid_at: string | null
  created_at: string
  status: string
}

interface Stats {
  totalRevenue: number
  paidCount: number
  pendingCount: number
  failedCount: number
  refundedCount: number
  paidRevenue: number
  pendingRevenue: number
  refundedRevenue: number
}

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially Refunded' },
]

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    refundedRevenue: 0,
  })
  const perPage = 50

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        ...(paymentFilter !== 'all' && { paymentStatus: paymentFilter }),
        ...(searchQuery && { search: searchQuery }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })

      const response = await fetch(`/api/admin/transactions?${params}`)
      const data = await response.json()

      if (data.transactions) {
        setTransactions(data.transactions)
        setTotalPages(data.totalPages)
        setTotal(data.total)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, paymentFilter, dateFrom, dateTo])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchTransactions()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

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

  const getPaymentIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3.5 w-3.5" />
      case 'pending': return <Clock className="h-3.5 w-3.5" />
      case 'failed': return <XCircle className="h-3.5 w-3.5" />
      case 'refunded': return <RotateCcw className="h-3.5 w-3.5" />
      case 'partially_refunded': return <RotateCcw className="h-3.5 w-3.5" />
      default: return <AlertCircle className="h-3.5 w-3.5" />
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'refunded': return 'bg-gray-100 text-gray-700'
      case 'partially_refunded': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const exportCSV = () => {
    const headers = ['Order Number', 'Customer', 'Email', 'Total', 'Subtotal', 'Delivery Fee', 'Discount', 'Payment Status', 'Stripe ID', 'Paid At', 'Created At']
    const rows = transactions.map(t => [
      t.order_number,
      t.customer_name,
      t.customer_email,
      (t.total_pence / 100).toFixed(2),
      (t.subtotal_pence / 100).toFixed(2),
      (t.delivery_fee_pence / 100).toFixed(2),
      (t.discount_pence / 100).toFixed(2),
      t.payment_status,
      t.stripe_payment_intent_id || '',
      t.paid_at || '',
      t.created_at,
    ])

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="h-7 w-7 text-emerald-600" />
            Transactions
          </h1>
          <p className="text-gray-500 mt-1">Payment transactions and revenue overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" className="gap-2" disabled={transactions.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={fetchTransactions} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <PoundSterling className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-emerald-600">{formatPrice(stats.paidRevenue)}</p>
              <p className="text-xs text-gray-400">{stats.paidCount} transactions</p>
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
              <p className="text-2xl font-bold text-yellow-600">{formatPrice(stats.pendingRevenue)}</p>
              <p className="text-xs text-gray-400">{stats.pendingCount} transactions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <RotateCcw className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Refunded / Failed</p>
              <p className="text-2xl font-bold text-red-600">{formatPrice(stats.refundedRevenue)}</p>
              <p className="text-xs text-gray-400">{stats.refundedCount + stats.failedCount} transactions</p>
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
              placeholder="Search by order number, customer, email, or Stripe ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              {PAYMENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {searchQuery || paymentFilter !== 'all' || dateFrom || dateTo
                ? 'Try adjusting your filters'
                : 'Transactions will appear here when payments are processed'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stripe ID
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{txn.order_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{txn.customer_name}</p>
                        <p className="text-sm text-gray-500">{txn.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-600">{formatDate(txn.created_at)}</p>
                        {txn.paid_at && (
                          <p className="text-xs text-emerald-600">Paid {formatDate(txn.paid_at)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-gray-600">{formatPrice(txn.subtotal_pence)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-gray-600">{formatPrice(txn.delivery_fee_pence)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {txn.discount_pence > 0 ? (
                        <p className="text-sm text-red-600">-{formatPrice(txn.discount_pence)}</p>
                      ) : (
                        <p className="text-sm text-gray-400">-</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(txn.total_pence)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentColor(txn.payment_status)}`}>
                        {getPaymentIcon(txn.payment_status)}
                        {txn.payment_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {txn.stripe_payment_intent_id ? (
                        <span className="text-xs font-mono text-gray-500 truncate max-w-[140px] block" title={txn.stripe_payment_intent_id}>
                          {txn.stripe_payment_intent_id.slice(0, 20)}...
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/${txn.id}`}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View order"
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
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{((page - 1) * perPage) + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(page * perPage, total)}</span> of{' '}
              <span className="font-semibold text-gray-900">{total}</span> transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
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
              <div className="sm:hidden text-sm font-medium text-gray-600">
                Page {page} of {totalPages}
              </div>
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
