'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
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
      case 'paid': return 'bg-(--brand-primary-light) text-(--brand-primary)'
      case 'pending': return 'bg-(--color-warning-bg) text-(--color-warning)'
      case 'failed': return 'bg-(--color-error-bg) text-(--color-error)'
      case 'refunded': return 'bg-(--color-elevated) text-foreground'
      case 'partially_refunded': return 'bg-(--color-warning-bg) text-(--brand-amber)'
      default: return 'bg-(--color-elevated) text-foreground'
    }
  }

  const exportCSV = async () => {
    try {
      // Fetch ALL matching transactions (not just current page)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
        ...(paymentFilter !== 'all' && { paymentStatus: paymentFilter }),
        ...(searchQuery && { search: searchQuery }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })

      const response = await fetch(`/api/admin/transactions?${params}`)
      const data = await response.json()
      const allTransactions = data.transactions || transactions

      const headers = ['Order Number', 'Customer', 'Email', 'Total', 'Subtotal', 'Delivery Fee', 'Discount', 'Payment Status', 'Stripe ID', 'Paid At', 'Created At']
      const rows = allTransactions.map((t: any) => [
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

      const csv = [headers, ...rows].map((r: string[]) => r.map((c: string) => `"${c}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${allTransactions.length} transactions`)
    } catch {
      toast.error('Failed to export transactions')
    }
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-7 w-7 text-(--brand-primary)" />
            Transactions
          </h1>
          <p className="text-(--color-text-muted) mt-1">Payment transactions and revenue overview</p>
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
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-(--brand-primary-light) rounded-lg">
              <PoundSterling className="h-5 w-5 text-(--brand-primary)" />
            </div>
            <div>
              <p className="text-sm text-(--color-text-muted)">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-(--color-info-bg) rounded-lg">
              <TrendingUp className="h-5 w-5 text-(--color-info)" />
            </div>
            <div>
              <p className="text-sm text-(--color-text-muted)">Paid</p>
              <p className="text-2xl font-bold text-(--brand-primary)">{formatPrice(stats.paidRevenue)}</p>
              <p className="text-xs text-(--color-text-disabled)">{stats.paidCount} transactions</p>
            </div>
          </div>
        </div>
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-(--color-warning-bg) rounded-lg">
              <Clock className="h-5 w-5 text-(--color-warning)" />
            </div>
            <div>
              <p className="text-sm text-(--color-text-muted)">Pending</p>
              <p className="text-2xl font-bold text-(--color-warning)">{formatPrice(stats.pendingRevenue)}</p>
              <p className="text-xs text-(--color-text-disabled)">{stats.pendingCount} transactions</p>
            </div>
          </div>
        </div>
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-(--color-error-bg) rounded-lg">
              <RotateCcw className="h-5 w-5 text-(--color-error)" />
            </div>
            <div>
              <p className="text-sm text-(--color-text-muted)">Refunded / Failed</p>
              <p className="text-2xl font-bold text-(--color-error)">{formatPrice(stats.refundedRevenue)}</p>
              <p className="text-xs text-(--color-text-disabled)">{stats.refundedCount + stats.failedCount} transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
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
              className="px-3 py-2 border border-(--color-border) rounded-lg text-sm focus:ring-2 focus:ring-(--brand-primary)"
            >
              {PAYMENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-(--color-text-disabled)" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-(--color-border) rounded-lg text-sm focus:ring-2 focus:ring-(--brand-primary)"
              />
              <span className="text-(--color-text-disabled) text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-(--color-border) rounded-lg text-sm focus:ring-2 focus:ring-(--brand-primary)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-(--color-elevated) rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-(--color-text-disabled)" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No transactions found</h3>
            <p className="text-(--color-text-muted)">
              {searchQuery || paymentFilter !== 'all' || dateFrom || dateTo
                ? 'Try adjusting your filters'
                : 'Transactions will appear here when payments are processed'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-(--color-border)">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Stripe ID
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{txn.order_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{txn.customer_name}</p>
                        <p className="text-sm text-(--color-text-muted)">{txn.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-(--color-text-secondary)">{formatDate(txn.created_at)}</p>
                        {txn.paid_at && (
                          <p className="text-xs text-(--brand-primary)">Paid {formatDate(txn.paid_at)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-(--color-text-secondary)">{formatPrice(txn.subtotal_pence)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-(--color-text-secondary)">{formatPrice(txn.delivery_fee_pence)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {txn.discount_pence > 0 ? (
                        <p className="text-sm text-(--color-error)">-{formatPrice(txn.discount_pence)}</p>
                      ) : (
                        <p className="text-sm text-(--color-text-disabled)">-</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-foreground">{formatPrice(txn.total_pence)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentColor(txn.payment_status)}`}>
                        {getPaymentIcon(txn.payment_status)}
                        {txn.payment_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {txn.stripe_payment_intent_id ? (
                        <span className="text-xs font-mono text-(--color-text-muted) truncate max-w-[140px] block" title={txn.stripe_payment_intent_id}>
                          {txn.stripe_payment_intent_id.slice(0, 20)}...
                        </span>
                      ) : (
                        <span className="text-xs text-(--color-text-disabled)">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/${txn.id}`}
                          className="p-2 text-(--color-text-disabled) hover:text-(--brand-primary) hover:bg-(--brand-primary-light) rounded-lg transition-colors"
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
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-(--color-text-secondary)">
              Showing <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}</span> to{' '}
              <span className="font-semibold text-foreground">{Math.min(page * perPage, total)}</span> of{' '}
              <span className="font-semibold text-foreground">{total}</span> transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border) disabled:hover:bg-(--color-elevated)"
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
                        ? 'bg-(--brand-primary) text-white shadow-lg shadow-(--shadow-green)'
                        : pageNum === '...'
                        ? 'bg-transparent text-(--color-text-disabled) cursor-default'
                        : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <div className="sm:hidden text-sm font-medium text-(--color-text-secondary)">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border) disabled:hover:bg-(--color-elevated)"
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
