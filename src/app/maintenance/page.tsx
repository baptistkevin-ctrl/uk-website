'use client'

import { useEffect } from 'react'
import { ShoppingBag, Wrench } from 'lucide-react'

export default function MaintenancePage() {
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          window.location.href = '/'
        }
      } catch {
        // Still in maintenance
      }
    }

    // Check every 10 seconds
    const interval = setInterval(checkMaintenance, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-(--brand-primary) rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Wrench className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          We&apos;ll Be Right Back
        </h1>

        <p className="text-(--color-text-secondary) text-lg mb-6">
          We&apos;re currently performing scheduled maintenance to improve your shopping experience. Please check back shortly.
        </p>

        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ShoppingBag className="h-5 w-5 text-(--brand-primary)" />
            <span className="font-semibold text-foreground">UK Grocery Store</span>
          </div>
          <p className="text-sm text-(--color-text-muted)">
            Fresh groceries delivered to your door across the UK.
            We apologize for any inconvenience.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-(--brand-primary) rounded-full animate-pulse" />
          <p className="text-sm text-(--color-text-muted)">Checking status automatically...</p>
        </div>

        <p className="text-sm text-(--color-text-muted)">
          If you need immediate assistance, email us at{' '}
          <a href="mailto:support@ukgrocerystore.com" className="text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium">
            support@ukgrocerystore.com
          </a>
        </p>
      </div>
    </div>
  )
}
