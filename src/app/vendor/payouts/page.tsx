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
  ArrowUpRight
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
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600">Track your earnings and payouts</p>
        </div>
        {vendor?.stripe_onboarding_complete && (
          <Button
            onClick={handleStripeDashboard}
            disabled={stripeLoading}
            variant="outline"
            className="border-emerald-200 text-emerald-700"
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
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Complete Stripe Setup</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Complete your Stripe account setup to receive payouts automatically.
              </p>
              <Button
                size="sm"
                className="mt-3 bg-yellow-600 hover:bg-yellow-700"
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
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(summary?.totalEarnings || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">All time earnings</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Available</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(summary?.available || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Ready for payout</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(summary?.pendingAmount || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Processing orders</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Paid Out</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(summary?.paidOut || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Total paid to you</p>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-gray-900">Payout History</h2>
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payouts yet</h3>
            <p className="text-gray-500">
              Payouts will appear here once you start receiving orders.
              {!vendor?.stripe_onboarding_complete && ' Complete Stripe setup to enable automatic payouts.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payouts.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    payout.status === 'completed' ? 'bg-emerald-100' :
                    payout.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {payout.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : payout.status === 'failed' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {payout.period_start && payout.period_end
                        ? `${new Date(payout.period_start).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${new Date(payout.period_end).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
                        : 'Payout'
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(payout.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatPrice(payout.amount_pence)}</p>
                  <div className="mt-1">{getStatusBadge(payout.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How Payouts Work */}
      <div className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="font-semibold mb-4">How Payouts Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <span className="font-bold">1</span>
            </div>
            <h3 className="font-medium mb-1">Customer Orders</h3>
            <p className="text-sm text-emerald-100">When a customer buys your product, the payment is processed securely.</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <span className="font-bold">2</span>
            </div>
            <h3 className="font-medium mb-1">Commission Deducted</h3>
            <p className="text-sm text-emerald-100">Platform commission ({vendor?.commission_rate || 15}%) is deducted from each sale.</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <span className="font-bold">3</span>
            </div>
            <h3 className="font-medium mb-1">Automatic Transfer</h3>
            <p className="text-sm text-emerald-100">Funds are automatically transferred to your Stripe account.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
