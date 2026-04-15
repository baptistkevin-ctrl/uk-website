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
      // Call the connect API GET endpoint to check status from Stripe
      const res = await fetch('/api/vendor/stripe/connect')
      const data = await res.json()
      if (data.onboardingComplete !== undefined) {
        // Update vendor state with latest Stripe status
        setVendor((prev: any) => prev ? {
          ...prev,
          stripe_onboarding_complete: data.onboardingComplete,
          stripe_charges_enabled: data.chargesEnabled,
          stripe_payouts_enabled: data.payoutsEnabled,
        } : prev)
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
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Fresh Groceries!</h1>
          <p className="text-(--color-text-secondary)">Complete these steps to start selling</p>
        </div>

        {/* Success message */}
        {success && vendor?.stripe_onboarding_complete && (
          <div className="mb-8 bg-(--brand-primary-light) border border-(--brand-primary)/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-(--brand-primary-light) rounded-lg">
                <CheckCircle className="h-6 w-6 text-(--brand-primary)" />
              </div>
              <div>
                <h3 className="font-semibold text-(--brand-primary)">Stripe Connected Successfully!</h3>
                <p className="text-(--brand-primary) text-sm">
                  Your payment account is now set up. You can start adding products.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Refresh message */}
        {refresh && (
          <div className="mb-8 bg-(--color-warning-bg) border border-(--color-border) rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-(--color-warning-bg) rounded-lg">
                <AlertCircle className="h-6 w-6 text-(--color-warning)" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Session Expired</h3>
                <p className="text-(--color-warning) text-sm">
                  Your onboarding session expired. Please continue where you left off.
                </p>
              </div>
              <Button
                onClick={handleStripeOnboarding}
                disabled={stripeLoading}
                className="bg-(--color-warning) hover:bg-yellow-700"
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
        <div className="bg-(--color-surface) rounded-2xl shadow-sm p-6 mb-8">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed
                    ? 'bg-(--brand-primary-light) text-(--brand-primary)'
                    : 'bg-(--color-elevated) text-(--color-text-disabled)'
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
                      step.completed ? 'text-(--brand-primary)' : 'text-foreground'
                    }`}>
                      {step.title}
                    </h3>
                    {step.completed && (
                      <span className="text-xs bg-(--brand-primary-light) text-(--brand-primary) px-2 py-1 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-(--color-text-secondary) mt-1">{step.description}</p>

                  {/* Action buttons */}
                  {step.id === 'stripe' && !step.completed && (
                    <div className="mt-3">
                      <Button
                        onClick={handleStripeOnboarding}
                        disabled={stripeLoading}
                        className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
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
                      <p className="text-xs text-(--color-text-muted) mt-2">
                        You'll be redirected to Stripe to complete the setup
                      </p>
                    </div>
                  )}

                  {step.id === 'products' && isComplete && (
                    <div className="mt-3">
                      <Link href="/vendor/products/new">
                        <Button className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
                          <Package className="h-4 w-4 mr-2" />
                          Add Your First Product
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-5 mt-10 w-0.5 h-6 bg-(--color-border)" />
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
              className="text-sm text-(--color-text-muted) hover:text-foreground inline-flex items-center gap-2"
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
              <Button size="lg" className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
                Go to Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Help section */}
        <div className="mt-8 p-6 bg-background rounded-xl text-center">
          <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
          <p className="text-sm text-(--color-text-secondary) mb-4">
            If you're having trouble setting up your account, our support team is here to help.
          </p>
          <Link href="/contact" className="text-(--brand-primary) hover:underline text-sm">
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
      <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
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
