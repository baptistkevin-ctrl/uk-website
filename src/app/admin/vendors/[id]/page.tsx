'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Store, ArrowLeft, Package, ShoppingCart, Star, CreditCard,
  Loader2, CheckCircle, XCircle, Clock, Mail, Phone, Globe,
  TrendingUp, Users, ExternalLink, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils/format'

interface VendorDetail {
  vendor: {
    id: string
    business_name: string
    slug: string
    email: string
    phone: string | null
    description: string | null
    logo_url: string | null
    status: string
    commission_rate: number
    rating: number
    review_count: number
    stripe_onboarding_complete: boolean
    stripe_payouts_enabled: boolean
    created_at: string
    user: { email: string; full_name: string } | null
  }
  stats: {
    totalProducts: number
    activeProducts: number
    totalOrders: number
    totalRevenue: number
    totalCommission: number
    totalPaidOut: number
    pendingPayout: number
    avgRating: number
  }
  recentOrders: { id: string; order_number: string; total_amount: number; status: string; created_at: string }[]
  topProducts: { id: string; name: string; image_url: string | null; sold: number; revenue: number }[]
}

export default function VendorDetailPage() {
  const params = useParams()
  const vendorId = params.id as string
  const [data, setData] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifyMessage, setNotifyMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchVendor() {
      try {
        // Fetch vendor info
        const vendorRes = await fetch('/api/admin/vendors')
        if (!vendorRes.ok) return
        const vendors = await vendorRes.json()
        const vendor = Array.isArray(vendors) ? vendors.find((v: any) => v.id === vendorId) : null
        if (!vendor) return

        // Fetch vendor stats from dashboard
        const dashRes = await fetch('/api/admin/dashboard')
        const dashData = dashRes.ok ? await dashRes.json() : null

        // Get vendor orders
        const vendorOrders = (dashData?.vendorLeaderboard || []).find((v: any) => v.id === vendorId)

        // Build stats from available data
        const stats = {
          totalProducts: 0,
          activeProducts: 0,
          totalOrders: vendorOrders?.orders || 0,
          totalRevenue: vendorOrders?.revenue || 0,
          totalCommission: 0,
          totalPaidOut: 0,
          pendingPayout: 0,
          avgRating: vendor.rating || 0,
        }

        setData({
          vendor,
          stats,
          recentOrders: [],
          topProducts: [],
        })
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchVendor()
  }, [vendorId])

  const handleNotify = async () => {
    if (!notifyMessage.trim() || !data?.vendor.email) return
    setSending(true)
    try {
      const { sendEmail } = await import('@/lib/email/send-email')
      // Use API route instead since we're client-side
      const res = await fetch('/api/admin/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vendorId, notify_message: notifyMessage }),
      })
      toast.success('Notification sent to vendor')
      setNotifyMessage('')
    } catch { toast.error('Failed to send notification') }
    finally { setSending(false) }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <Store className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Vendor not found</h2>
        <Link href="/admin/vendors"><Button variant="outline" className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Vendors</Button></Link>
      </div>
    )
  }

  const v = data.vendor

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/vendors"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {v.logo_url ? (
              <Image src={v.logo_url} alt={v.business_name} width={48} height={48} className="rounded-xl object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-(--brand-primary-light) flex items-center justify-center">
                <Store className="h-6 w-6 text-(--brand-primary)" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{v.business_name}</h1>
              <div className="flex items-center gap-3 text-sm text-(--color-text-muted)">
                <span>{v.email}</span>
                {v.phone && <span>{v.phone}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={v.status === 'approved' ? 'bg-(--color-success)/10 text-(--color-success)' : 'bg-(--color-warning)/10 text-(--color-warning)'}>
            {v.status}
          </Badge>
          <Link href={`/store/${v.slug}`} target="_blank">
            <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1.5" /> View Store</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <Package className="h-5 w-5 text-(--brand-primary) mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{data.stats.totalProducts}</p>
          <p className="text-xs text-(--color-text-muted)">Total Products</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <ShoppingCart className="h-5 w-5 text-(--color-info) mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{data.stats.totalOrders}</p>
          <p className="text-xs text-(--color-text-muted)">Total Orders</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <TrendingUp className="h-5 w-5 text-(--color-success) mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(data.stats.totalRevenue)}</p>
          <p className="text-xs text-(--color-text-muted)">Total Revenue</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <Star className="h-5 w-5 text-(--brand-amber) mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{data.stats.avgRating || 'N/A'}</p>
          <p className="text-xs text-(--color-text-muted)">{v.review_count || 0} Reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Profile */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="font-semibold text-foreground mb-4">Vendor Profile</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-(--color-border)">
              <span className="text-sm text-(--color-text-muted)">Business Name</span>
              <span className="text-sm font-medium text-foreground">{v.business_name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-(--color-border)">
              <span className="text-sm text-(--color-text-muted)">Owner</span>
              <span className="text-sm font-medium text-foreground">{v.user?.full_name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-(--color-border)">
              <span className="text-sm text-(--color-text-muted)">Email</span>
              <a href={`mailto:${v.email}`} className="text-sm text-(--brand-primary) hover:underline flex items-center gap-1"><Mail className="h-3 w-3" /> {v.email}</a>
            </div>
            {v.phone && (
              <div className="flex items-center justify-between py-2 border-b border-(--color-border)">
                <span className="text-sm text-(--color-text-muted)">Phone</span>
                <span className="text-sm text-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {v.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-(--color-border)">
              <span className="text-sm text-(--color-text-muted)">Commission Rate</span>
              <span className="text-sm font-bold text-(--brand-primary)">{v.commission_rate}%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-(--color-border)">
              <span className="text-sm text-(--color-text-muted)">Store URL</span>
              <Link href={`/store/${v.slug}`} className="text-sm text-(--brand-primary) hover:underline">/store/{v.slug}</Link>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-(--color-border)">
              <span className="text-sm text-(--color-text-muted)">Joined</span>
              <span className="text-sm text-foreground">{new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-(--color-text-muted)">Stripe</span>
              <div className="flex items-center gap-2">
                {v.stripe_onboarding_complete ? (
                  <span className="flex items-center gap-1 text-sm text-(--color-success)"><CheckCircle className="h-4 w-4" /> Connected</span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-(--color-warning)"><Clock className="h-4 w-4" /> Pending</span>
                )}
                {v.stripe_payouts_enabled && (
                  <Badge className="bg-(--color-success)/10 text-(--color-success) text-xs">Payouts Enabled</Badge>
                )}
              </div>
            </div>
          </div>
          {v.description && (
            <div className="mt-4 pt-4 border-t border-(--color-border)">
              <p className="text-sm text-(--color-text-muted) mb-1">Description</p>
              <p className="text-sm text-(--color-text-secondary)">{v.description}</p>
            </div>
          )}
        </div>

        {/* Send Notification */}
        <div className="space-y-6">
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-(--color-text-muted)" />
              Send Notification to Vendor
            </h2>
            <textarea
              value={notifyMessage}
              onChange={e => setNotifyMessage(e.target.value)}
              rows={4}
              placeholder="Type a message to send to this vendor via email..."
              className="w-full px-4 py-3 border border-(--color-border) rounded-lg text-sm bg-background text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) outline-none resize-none mb-3"
            />
            <Button onClick={handleNotify} disabled={sending || !notifyMessage.trim()} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Email
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href={`/store/${v.slug}`} target="_blank" className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-(--color-elevated) transition-colors">
                <span className="text-sm text-foreground">View Public Store</span>
                <ExternalLink className="h-4 w-4 text-(--color-text-muted)" />
              </Link>
              <Link href="/admin/vendor-applications" className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-(--color-elevated) transition-colors">
                <span className="text-sm text-foreground">Manage Applications</span>
                <ExternalLink className="h-4 w-4 text-(--color-text-muted)" />
              </Link>
              <Link href="/admin/finance" className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-(--color-elevated) transition-colors">
                <span className="text-sm text-foreground">View Platform Finance</span>
                <ExternalLink className="h-4 w-4 text-(--color-text-muted)" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
