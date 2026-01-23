'use client'

import { useEffect, useState } from 'react'
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
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils/format'

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

  useEffect(() => {
    fetchVendors()
  }, [statusFilter])

  const fetchVendors = async () => {
    try {
      const res = await fetch(`/api/admin/vendors?status=${statusFilter}`)
      const data = await res.json()
      setVendors(data)
    } catch (error) {
      console.error('Fetch vendors error:', error)
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
      alert('Invalid commission rate')
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

  const filteredVendors = vendors.filter(v =>
    v.business_name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Approved</span>
      case 'suspended':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Suspended</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">{vendors.length} total vendors</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Stripe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Store className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vendor.business_name}</p>
                      <p className="text-sm text-gray-500">/{vendor.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <p className="text-sm text-gray-900">{vendor.email}</p>
                  <p className="text-sm text-gray-500">{vendor.phone || 'No phone'}</p>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(vendor.status)}
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  {vendor.stripe_onboarding_complete ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Connected</span>
                    </div>
                  ) : vendor.stripe_account_id ? (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Incomplete</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Not connected</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === vendor.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editCommission}
                        onChange={(e) => setEditCommission(e.target.value)}
                        className="w-20 h-8 text-sm"
                        placeholder="%"
                      />
                      <button
                        onClick={() => updateCommissionRate(vendor.id)}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditCommission('') }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(vendor.id); setEditCommission(vendor.commission_rate.toString()) }}
                      className="text-sm text-gray-900 hover:text-emerald-600"
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
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Suspend
                      </Button>
                    ) : vendor.status === 'suspended' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVendorStatus(vendor.id, 'approved')}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        Reactivate
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVendors.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No vendors found
          </div>
        )}
      </div>
    </div>
  )
}
