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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-400/25">
          <Wrench className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          We&apos;ll Be Right Back
        </h1>

        <p className="text-gray-600 text-lg mb-6">
          We&apos;re currently performing scheduled maintenance to improve your shopping experience. Please check back shortly.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ShoppingBag className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-gray-900">FreshMart UK</span>
          </div>
          <p className="text-sm text-gray-500">
            Fresh groceries delivered to your door across the UK.
            We apologize for any inconvenience.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-sm text-gray-500">Checking status automatically...</p>
        </div>

        <p className="text-sm text-gray-400">
          If you need immediate assistance, email us at{' '}
          <a href="mailto:support@freshmart.co.uk" className="text-green-600 hover:text-green-700 font-medium">
            support@freshmart.co.uk
          </a>
        </p>
      </div>
    </div>
  )
}
