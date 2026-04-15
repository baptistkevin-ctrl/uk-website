'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Loader2,
  ExternalLink,
  AlertCircle,
  Wallet,
  ArrowUpRight,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/format'

interface Payout {
  id: string
  amount_pence: number
  status: string
  stripe_transfer_id: string | null
  period_start: string | null
  period_end: string | null
  created_at: string
  processed_at: string | null
}

interface PayoutSummary {
  totalEarnings: number
  pendingAmount: number
  paidOut: number
  available: number
}

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [summary, setSummary] = useState<PayoutSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [vendor, setVendor] = useState<any>(null)
  const [stripeLoading, setStripeLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get vendor info
      const vendorRes = await fetch('/api/vendor/register')
      const vendorData = await vendorRes.json()
      setVendor(vendorData.vendor)

      // Get payouts
      const payoutsRes = await fetch('/api/vendor/payouts')
      const payoutsData = await payoutsRes.json()
      setPayouts(payoutsData.payouts || [])
      setSummary(payoutsData.summary)
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStripeDashboard = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch('/api/vendor/stripe/dashboard', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Stripe dashboard error:', error)
    } finally {
      setStripeLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-(--color-warning-bg) text-(--color-warning)',
      processing: 'bg-(--color-info-bg) text-(--color-info)',
      completed: 'bg-(--brand-primary-light) text-(--brand-primary)',
      failed: 'bg-(--color-error-bg) text-(--color-error)',
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status] || 'bg-(--color-elevated) text-foreground'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-(--color-text-secondary)">Track your earnings and payouts</p>
        </div>
        {vendor?.stripe_onboarding_complete && (
          <Button
            onClick={handleStripeDashboard}
            disabled={stripeLoading}
            variant="outline"
            className="border-(--brand-primary)/20 text-(--brand-primary)"
          >
            {stripeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Stripe Dashboard
          </Button>
        )}
      </div>

      {/* Stripe Setup Alert */}
      {!vendor?.stripe_onboarding_complete && (
        <div className="mb-6 bg-(--color-warning-bg) border border-(--color-border) rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-(--color-warning) mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Complete Stripe Setup</h3>
              <p className="text-sm text-(--color-warning) mt-1">
                Complete your Stripe account setup to receive payouts automatically.
              </p>
              <Button
                size="sm"
                className="mt-3 bg-(--color-warning) hover:bg-yellow-700"
                onClick={() => window.location.href = '/vendor/onboarding'}
              >
                Complete Setup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-(--brand-primary-light) rounded-lg">
              <TrendingUp className="h-5 w-5 text-(--brand-primary)" />
            </div>
            <span className="text-sm text-(--color-text-muted)">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatPrice(summary?.totalEarnings || 0)}</p>
          <p className="text-xs text-(--color-text-muted) mt-1">All time earnings</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-(--color-info-bg) rounded-lg">
              <Wallet className="h-5 w-5 text-(--color-info)" />
            </div>
            <span className="text-sm text-(--color-text-muted)">Available</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatPrice(summary?.available || 0)}</p>
          <p className="text-xs text-(--color-text-muted) mt-1">Ready for payout</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-(--color-warning-bg) rounded-lg">
              <Clock className="h-5 w-5 text-(--color-warning)" />
            </div>
            <span className="text-sm text-(--color-text-muted)">Pending</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatPrice(summary?.pendingAmount || 0)}</p>
          <p className="text-xs text-(--color-text-muted) mt-1">Processing orders</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-(--color-info-bg) rounded-lg">
              <CheckCircle className="h-5 w-5 text-(--color-info)" />
            </div>
            <span className="text-sm text-(--color-text-muted)">Paid Out</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatPrice(summary?.paidOut || 0)}</p>
          <p className="text-xs text-(--color-text-muted) mt-1">Total paid to you</p>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-(--color-surface) rounded-xl shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Payout History</h2>
          {payouts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/vendor/payouts/export', '_blank')}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No payouts yet</h3>
            <p className="text-(--color-text-muted)">
              Payouts will appear here once you start receiving orders.
              {!vendor?.stripe_onboarding_complete && ' Complete Stripe setup to enable automatic payouts.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-(--color-border)">
            {payouts.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between hover:bg-background">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    payout.status === 'completed' ? 'bg-(--brand-primary-light)' :
                    payout.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {payout.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-(--brand-primary)" />
                    ) : payout.status === 'failed' ? (
                      <AlertCircle className="h-5 w-5 text-(--color-error)" />
                    ) : (
                      <Clock className="h-5 w-5 text-(--color-warning)" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {payout.period_start && payout.period_end
                        ? `${new Date(payout.period_start).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${new Date(payout.period_end).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
                        : 'Payout'
                      }
                    </p>
                    <p className="text-sm text-(--color-text-muted)">
                      {new Date(payout.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatPrice(payout.amount_pence)}</p>
                  <div className="mt-1">{getStatusBadge(payout.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How Payouts Work */}
      <div className="mt-8 bg-linear-to-r from-(--brand-primary) to-teal-600 rounded-xl p-6 text-white">
        <h2 className="font-semibold mb-4">How Payouts Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-(--color-surface)/10 rounded-lg p-4">
            <div className="w-8 h-8 bg-(--color-surface)/20 rounded-full flex items-center justify-center mb-3">
              <span className="font-bold">1</span>
            </div>
            <h3 className="font-medium mb-1">Customer Orders</h3>
            <p className="text-sm text-white/80">When a customer buys your product, the payment is processed securely.</p>
          </div>
          <div className="bg-(--color-surface)/10 rounded-lg p-4">
            <div className="w-8 h-8 bg-(--color-surface)/20 rounded-full flex items-center justify-center mb-3">
              <span className="font-bold">2</span>
            </div>
            <h3 className="font-medium mb-1">Commission Deducted</h3>
            <p className="text-sm text-white/80">Platform commission ({vendor?.commission_rate || 12.5}%) is deducted from each sale.</p>
          </div>
          <div className="bg-(--color-surface)/10 rounded-lg p-4">
            <div className="w-8 h-8 bg-(--color-surface)/20 rounded-full flex items-center justify-center mb-3">
              <span className="font-bold">3</span>
            </div>
            <h3 className="font-medium mb-1">Automatic Transfer</h3>
            <p className="text-sm text-white/80">Funds are automatically transferred to your Stripe account.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
