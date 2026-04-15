'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout'
import { formatDistanceToNow, format } from 'date-fns'
import { formatPrice } from '@/lib/utils/format'
import {
  FileText,
  Search,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  Eye,
  Download
} from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  billing_name: string
  billing_email: string
  status: string
  total_pence: number
  subtotal_pence: number
  vat_amount_pence: number
  issue_date: string
  due_date: string | null
  paid_date: string | null
  order: { id: string; order_number: string } | null
  user: { id: string; full_name: string; email: string } | null
}

interface Stats {
  total_invoices: number
  total_value_pence: number
  paid_count: number
  paid_value_pence: number
  pending_count: number
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/invoices?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.billing_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.billing_email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-(--brand-primary-light) text-(--brand-primary)'
      case 'pending': return 'bg-(--brand-amber-soft) text-(--brand-amber)'
      case 'issued': return 'bg-(--color-info-bg) text-(--color-info)'
      case 'cancelled': return 'bg-(--color-error-bg) text-(--color-error)'
      case 'overdue': return 'bg-(--color-error-bg) text-(--color-error)'
      default: return 'bg-(--color-elevated) text-foreground'
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-7 w-7 text-(--brand-primary)" />
              Invoices
            </h1>
            <p className="text-(--color-text-muted) mt-1">
              Manage customer invoices and billing
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Total Invoices</p>
                  <p className="text-xl font-bold text-foreground">{stats.total_invoices}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-(--color-info)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Total Value</p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(stats.total_value_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Paid</p>
                  <p className="text-xl font-bold text-foreground">{stats.paid_count}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-(--color-info)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Paid Value</p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(stats.paid_value_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-amber-soft) rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-(--brand-amber)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Pending</p>
                  <p className="text-xl font-bold text-foreground">{stats.pending_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex bg-(--color-elevated) rounded-lg p-1">
            {['all', 'paid', 'pending', 'issued', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-(--color-surface) shadow text-foreground'
                    : 'text-(--color-text-secondary) hover:text-foreground'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number or customer..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
            />
          </div>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-background rounded-xl">
            <FileText className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
            <p className="text-(--color-text-muted)">No invoices found</p>
          </div>
        ) : (
          <div className="bg-(--color-surface) rounded-xl shadow-sm border border-(--color-border) overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Invoice
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Order
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Amount
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-background">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium text-foreground">
                        {invoice.invoice_number}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">
                        {invoice.billing_name}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">{invoice.billing_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">
                        {invoice.order?.order_number || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-foreground">
                        {formatPrice(invoice.total_pence)}
                      </span>
                      <p className="text-xs text-(--color-text-muted)">
                        VAT: {formatPrice(invoice.vat_amount_pence)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-(--color-text-secondary)">
                        {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
                      </span>
                      {invoice.paid_date && (
                        <p className="text-xs text-(--brand-primary)">
                          Paid {formatDistanceToNow(new Date(invoice.paid_date))} ago
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/account/invoices/${invoice.id}`}
                          className="p-1.5 text-(--color-text-secondary) hover:bg-(--color-elevated) rounded"
                          title="View invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/account/invoices/${invoice.id}`}
                          className="p-1.5 text-(--brand-primary) hover:bg-(--brand-primary-light) rounded"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
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
    </AdminLayout>
  )
}
