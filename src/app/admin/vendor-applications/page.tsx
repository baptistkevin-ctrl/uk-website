'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  Loader2,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Application {
  id: string
  user_id: string
  business_name: string
  business_type: string
  description: string
  product_categories: string[]
  expected_monthly_sales: string
  website_url: string
  phone: string
  status: string
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  user: {
    email: string
    full_name: string
  } | null
}

export default function AdminVendorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [statusFilter])

  const fetchApplications = async () => {
    try {
      const res = await fetch(`/api/admin/vendor-applications?status=${statusFilter}`)
      const data = await res.json()
      setApplications(data)
    } catch (error) {
      console.error('Fetch applications error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/vendor-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          admin_notes: adminNotes
        })
      })

      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id))
        setSelectedApp(null)
        setAdminNotes('')
        alert(status === 'approved' ? 'Application approved and vendor account created!' : 'Application rejected')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to process application')
      }
    } catch (error) {
      console.error('Review error:', error)
      alert('Failed to process application')
    } finally {
      setProcessing(false)
    }
  }

  const filteredApplications = applications.filter(a =>
    a.business_name.toLowerCase().includes(search.toLowerCase()) ||
    a.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-(--brand-primary-light) text-(--brand-primary) flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-(--color-error-bg) text-(--color-error) flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-(--color-warning-bg) text-(--color-warning) flex items-center gap-1"><Clock className="h-3 w-3" />Pending</span>
    }
  }

  const formatBusinessType = (type: string) => {
    const types: Record<string, string> = {
      sole_trader: 'Sole Trader',
      limited_company: 'Limited Company',
      partnership: 'Partnership',
      other: 'Other'
    }
    return types[type] || type
  }

  const formatSalesRange = (range: string) => {
    const ranges: Record<string, string> = {
      under_1000: 'Under £1,000',
      '1000_5000': '£1,000 - £5,000',
      '5000_10000': '£5,000 - £10,000',
      '10000_50000': '£10,000 - £50,000',
      over_50000: 'Over £50,000'
    }
    return ranges[range] || range || 'Not specified'
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
          <h1 className="text-2xl font-bold text-foreground">Vendor Applications</h1>
          <p className="text-(--color-text-secondary)">{applications.length} applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-(--color-surface) rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
            <Input
              placeholder="Search applications..."
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
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className={`bg-(--color-surface) rounded-xl shadow-sm p-6 cursor-pointer transition-all ${
                  selectedApp?.id === app.id ? 'ring-2 ring-(--brand-primary)' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-(--color-elevated) rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-(--color-text-secondary)" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{app.business_name}</h3>
                      <p className="text-sm text-(--color-text-muted)">{formatBusinessType(app.business_type)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3 text-(--color-text-disabled)" />
                        <span className="text-sm text-(--color-text-secondary)">{app.user?.full_name || app.user?.email}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {app.product_categories && app.product_categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {app.product_categories.slice(0, 3).map((cat, i) => (
                      <span key={i} className="px-2 py-0.5 bg-(--color-elevated) text-(--color-text-secondary) text-xs rounded-full">
                        {cat}
                      </span>
                    ))}
                    {app.product_categories.length > 3 && (
                      <span className="text-xs text-(--color-text-muted)">+{app.product_categories.length - 3} more</span>
                    )}
                  </div>
                )}

                <div className="mt-4 text-xs text-(--color-text-muted)">
                  Applied {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
              <p className="text-(--color-text-muted)">No applications found</p>
            </div>
          )}
        </div>

        {/* Application Details */}
        <div className="lg:col-span-1">
          {selectedApp ? (
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-foreground mb-4">Application Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-(--color-text-muted) uppercase">Business Name</label>
                  <p className="font-medium text-foreground">{selectedApp.business_name}</p>
                </div>

                <div>
                  <label className="text-xs text-(--color-text-muted) uppercase">Business Type</label>
                  <p className="text-foreground">{formatBusinessType(selectedApp.business_type)}</p>
                </div>

                <div>
                  <label className="text-xs text-(--color-text-muted) uppercase">Applicant</label>
                  <p className="text-foreground">{selectedApp.user?.full_name || 'N/A'}</p>
                  <p className="text-sm text-(--color-text-muted)">{selectedApp.user?.email}</p>
                </div>

                <div>
                  <label className="text-xs text-(--color-text-muted) uppercase">Phone</label>
                  <p className="text-foreground">{selectedApp.phone || 'Not provided'}</p>
                </div>

                {selectedApp.website_url && (
                  <div>
                    <label className="text-xs text-(--color-text-muted) uppercase">Website</label>
                    <a
                      href={selectedApp.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--brand-primary) hover:underline text-sm block"
                    >
                      {selectedApp.website_url}
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-xs text-(--color-text-muted) uppercase">Expected Monthly Sales</label>
                  <p className="text-foreground">{formatSalesRange(selectedApp.expected_monthly_sales)}</p>
                </div>

                {selectedApp.product_categories && selectedApp.product_categories.length > 0 && (
                  <div>
                    <label className="text-xs text-(--color-text-muted) uppercase">Categories</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedApp.product_categories.map((cat, i) => (
                        <span key={i} className="px-2 py-0.5 bg-(--color-elevated) text-foreground text-xs rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.description && (
                  <div>
                    <label className="text-xs text-(--color-text-muted) uppercase">Description</label>
                    <p className="text-foreground text-sm">{selectedApp.description}</p>
                  </div>
                )}

                {selectedApp.status === 'pending' && (
                  <>
                    <div>
                      <label className="text-xs text-(--color-text-muted) uppercase">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes (optional)..."
                        className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg text-sm focus:ring-2 focus:ring-(--brand-primary)"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleReview(selectedApp.id, 'approved')}
                        disabled={processing}
                        className="flex-1 bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleReview(selectedApp.id, 'rejected')}
                        disabled={processing}
                        variant="outline"
                        className="flex-1 border-(--color-border) text-(--color-error) hover:bg-(--color-error-bg)"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {selectedApp.admin_notes && selectedApp.status !== 'pending' && (
                  <div>
                    <label className="text-xs text-(--color-text-muted) uppercase">Admin Notes</label>
                    <p className="text-foreground text-sm">{selectedApp.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-8 text-center sticky top-6">
              <Eye className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
              <p className="text-(--color-text-muted)">Select an application to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
