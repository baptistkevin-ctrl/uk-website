'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  CreditCard,
  Store,
  Package,
  ArrowRight,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
}

function VendorOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const success = searchParams.get('success')
  const refresh = searchParams.get('refresh')

  useEffect(() => {
    fetchVendorData()
  }, [])

  useEffect(() => {
    // If coming back from Stripe, refresh the data
    if (success || refresh) {
      refreshStripeStatus()
    }
  }, [success, refresh])

  const fetchVendorData = async () => {
    try {
      const res = await fetch('/api/vendor/register')
      const data = await res.json()

      if (!data.isVendor) {
        router.push('/sell')
        return
      }

      setVendor(data.vendor)
    } catch (error) {
      console.error('Vendor fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStripeStatus = async () => {
    setRefreshing(true)
    try {
      // Call the connect API to refresh status from Stripe
      const res = await fetch('/api/vendor/stripe/connect', {
        method: 'POST'
      })
      const data = await res.json()
      if (data.vendor) {
        setVendor(data.vendor)
      }
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleStripeOnboarding = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch('/api/vendor/stripe/onboarding', {
        method: 'POST'
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.details || data.error || 'Failed to start onboarding')
      }
    } catch (error) {
      alert('Failed to connect to Stripe')
    } finally {
      setStripeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const steps: OnboardingStep[] = [
    {
      id: 'account',
      title: 'Create Account',
      description: 'Your vendor account has been approved',
      icon: Store,
      completed: true
    },
    {
      id: 'stripe',
      title: 'Connect Stripe',
      description: 'Set up payments to receive money from sales',
      icon: CreditCard,
      completed: vendor?.stripe_onboarding_complete
    },
    {
      id: 'products',
      title: 'Add Products',
      description: 'List your first products to start selling',
      icon: Package,
      completed: false // Will be dynamic based on product count
    }
  ]

  const isComplete = vendor?.stripe_onboarding_complete

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Fresh Groceries!</h1>
          <p className="text-gray-600">Complete these steps to start selling</p>
        </div>

        {/* Success message */}
        {success && vendor?.stripe_onboarding_complete && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-800">Stripe Connected Successfully!</h3>
                <p className="text-emerald-700 text-sm">
                  Your payment account is now set up. You can start adding products.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Refresh message */}
        {refresh && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Session Expired</h3>
                <p className="text-yellow-700 text-sm">
                  Your onboarding session expired. Please continue where you left off.
                </p>
              </div>
              <Button
                onClick={handleStripeOnboarding}
                disabled={stripeLoading}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {stripeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Continue Setup'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${
                      step.completed ? 'text-emerald-700' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h3>
                    {step.completed && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                  {/* Action buttons */}
                  {step.id === 'stripe' && !step.completed && (
                    <div className="mt-3">
                      <Button
                        onClick={handleStripeOnboarding}
                        disabled={stripeLoading}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {stripeLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Connect Stripe Account
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        You'll be redirected to Stripe to complete the setup
                      </p>
                    </div>
                  )}

                  {step.id === 'products' && isComplete && (
                    <div className="mt-3">
                      <Link href="/vendor/products/new">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          <Package className="h-4 w-4 mr-2" />
                          Add Your First Product
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-5 mt-10 w-0.5 h-6 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Refresh status */}
        {vendor?.stripe_account_id && !vendor?.stripe_onboarding_complete && (
          <div className="text-center">
            <button
              onClick={refreshStripeStatus}
              disabled={refreshing}
              className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Checking...' : 'Check Stripe status'}
            </button>
          </div>
        )}

        {/* Complete CTA */}
        {isComplete && (
          <div className="text-center">
            <Link href="/vendor/dashboard">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Go to Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Help section */}
        <div className="mt-8 p-6 bg-gray-50 rounded-xl text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you're having trouble setting up your account, our support team is here to help.
          </p>
          <Link href="/contact" className="text-emerald-600 hover:underline text-sm">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}

function VendorOnboardingLoading() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  )
}

export default function VendorOnboarding() {
  return (
    <Suspense fallback={<VendorOnboardingLoading />}>
      <VendorOnboardingContent />
    </Suspense>
  )
}
