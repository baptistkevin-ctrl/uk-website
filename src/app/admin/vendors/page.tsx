'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Store,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ExternalLink,
  Mail,
  Loader2,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils/format'
import { toast } from '@/hooks/use-toast'

interface Vendor {
  id: string
  user_id: string
  business_name: string
  slug: string
  email: string
  phone: string
  status: string
  commission_rate: number
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  stripe_payouts_enabled: boolean
  created_at: string
  user: {
    email: string
    full_name: string
  } | null
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCommission, setEditCommission] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [statusFilter])

  const fetchVendors = async () => {
    try {
      const res = await fetch(`/api/admin/vendors?status=${statusFilter}`)
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        console.error('Fetch vendors error:', data?.error || 'Invalid response')
        setVendors([])
        return
      }
      setVendors(data)
    } catch (error) {
      console.error('Fetch vendors error:', error)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const updateVendorStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (res.ok) {
        setVendors(prev =>
          prev.map(v => v.id === id ? { ...v, status } : v)
        )
      }
    } catch (error) {
      console.error('Update error:', error)
    }
  }

  const updateCommissionRate = async (id: string) => {
    const rate = parseFloat(editCommission)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.warning('Invalid commission rate')
      return
    }

    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, commission_rate: rate })
      })

      if (res.ok) {
        setVendors(prev =>
          prev.map(v => v.id === id ? { ...v, commission_rate: rate } : v)
        )
        setEditingId(null)
        setEditCommission('')
      }
    } catch (error) {
      console.error('Update commission error:', error)
    }
  }

  const deleteVendor = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/vendors?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        setVendors(prev => prev.filter(v => v.id !== id))
        setDeleteConfirm(null)
        toast.success('Vendor deleted successfully')
      } else {
        toast.error(data.error || 'Failed to delete vendor')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete vendor')
    } finally {
      setDeleting(false)
    }
  }

  const filteredVendors = vendors.filter(v =>
    v.business_name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-(--brand-primary-light) text-(--brand-primary)">Approved</span>
      case 'suspended':
        return <span className="px-2 py-1 text-xs rounded-full bg-(--color-error-bg) text-(--color-error)">Suspended</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-(--color-warning-bg) text-(--color-warning)">Pending</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-(--color-elevated) text-foreground">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-(--color-text-secondary)">{vendors.length} total vendors</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-(--color-surface) rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
            <Input
              placeholder="Search vendors..."
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
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-(--color-surface) rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase hidden md:table-cell">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase hidden sm:table-cell">Stripe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Commission</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-(--color-text-muted) uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-background">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                      <Store className="h-5 w-5 text-(--brand-primary)" />
                    </div>
                    <div>
                      <Link href={`/admin/vendors/${vendor.id}`} className="font-medium text-(--brand-primary) hover:underline transition-colors">
                        {vendor.business_name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-(--color-text-muted)">/{vendor.slug}</p>
                        <Link
                          href={`/store/${vendor.slug}`}
                          target="_blank"
                          className="text-xs text-(--color-info) hover:underline"
                        >
                          View Store
                        </Link>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <p className="text-sm text-foreground">{vendor.email}</p>
                  <p className="text-sm text-(--color-text-muted)">{vendor.phone || 'No phone'}</p>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(vendor.status)}
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  {vendor.stripe_onboarding_complete ? (
                    <div className="flex items-center gap-1 text-(--brand-primary)">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Connected</span>
                    </div>
                  ) : vendor.stripe_account_id ? (
                    <div className="flex items-center gap-1 text-(--color-warning)">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Incomplete</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-(--color-text-disabled)">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Not connected</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === vendor.id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex gap-1">
                        {[5, 8, 10, 12.5, 15].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setEditCommission(preset.toString())}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              editCommission === preset.toString()
                                ? 'bg-(--brand-primary-light) border-(--brand-primary) text-(--brand-primary)'
                                : 'border-(--color-border) hover:border-(--brand-primary)/30 text-(--color-text-secondary)'
                            }`}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        value={editCommission}
                        onChange={(e) => setEditCommission(e.target.value)}
                        className="w-20 h-8 text-sm"
                        placeholder="%"
                        min="0"
                        max="100"
                        step="0.5"
                      />
                      <button
                        onClick={() => updateCommissionRate(vendor.id)}
                        className="text-(--brand-primary) hover:text-(--brand-primary)"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditCommission('') }}
                        className="text-(--color-text-disabled) hover:text-(--color-text-secondary)"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(vendor.id); setEditCommission(vendor.commission_rate.toString()) }}
                      className={`text-sm font-medium px-2 py-1 rounded hover:bg-(--brand-primary-light) ${
                        vendor.commission_rate <= 5 ? 'text-(--color-info)' :
                        vendor.commission_rate <= 10 ? 'text-(--brand-primary)' :
                        'text-foreground'
                      }`}
                    >
                      {vendor.commission_rate}%
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {vendor.status === 'approved' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVendorStatus(vendor.id, 'suspended')}
                        className="text-(--color-error) border-(--color-border) hover:bg-(--color-error-bg)"
                      >
                        Suspend
                      </Button>
                    ) : vendor.status === 'suspended' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVendorStatus(vendor.id, 'approved')}
                        className="text-(--brand-primary) border-(--brand-primary)/20 hover:bg-(--brand-primary-light)"
                      >
                        Reactivate
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(vendor.id)}
                      className="text-(--color-error) border-(--color-border) hover:bg-(--color-error-bg)"
                      title="Delete vendor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVendors.length === 0 && (
          <div className="p-8 text-center text-(--color-text-muted)">
            No vendors found
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-(--color-surface) rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-(--color-error-bg) flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-(--color-error)" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete Vendor</h3>
                <p className="text-sm text-(--color-text-muted)">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-(--color-text-secondary) mb-2">
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">
                {vendors.find(v => v.id === deleteConfirm)?.business_name}
              </strong>?
            </p>

            <div className="bg-(--color-elevated) rounded-lg p-3 mb-6 text-sm text-(--color-text-muted) space-y-1">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Delete the vendor account permanently</li>
                <li>Remove all their products from the store</li>
                <li>Reset the user back to a customer role</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteVendor(deleteConfirm)}
                disabled={deleting}
                className="flex-1 bg-(--color-error) hover:bg-(--color-error)/90 text-white"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Vendor
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
