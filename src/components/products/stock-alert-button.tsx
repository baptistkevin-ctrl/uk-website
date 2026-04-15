'use client'

import { useState } from 'react'
import { Bell, BellRing, Loader2, Mail, Check } from 'lucide-react'

interface StockAlertButtonProps {
  productId: string
  productName: string
  isLoggedIn: boolean
  userEmail?: string
  className?: string
}

export function StockAlertButton({
  productId,
  productName,
  isLoggedIn,
  userEmail,
  className = ''
}: StockAlertButtonProps) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState(userEmail || '')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubscribe = async () => {
    if (!email && !isLoggedIn) {
      setShowForm(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          email: email || undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSubscribed(true)
        setMessage(data.message)
        setShowForm(false)
      } else {
        setMessage(data.error || 'Failed to subscribe')
      }
    } catch (error) {
      setMessage('Failed to subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className={`bg-(--brand-primary-light) border border-(--brand-primary) rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-(--brand-primary-light) rounded-full flex items-center justify-center">
            <Check className="h-5 w-5 text-(--brand-primary)" />
          </div>
          <div>
            <p className="font-medium text-(--brand-primary)">You're on the list!</p>
            <p className="text-sm text-(--brand-primary)">{message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <BellRing className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="font-medium text-amber-800">Out of Stock</p>
          <p className="text-sm text-amber-600">Get notified when this item is back</p>
        </div>
      </div>

      {showForm && !isLoggedIn ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              />
            </div>
            <button
              onClick={handleSubscribe}
              disabled={!email || loading}
              className="px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Notify Me
            </button>
          </div>
          <button
            onClick={() => setShowForm(false)}
            className="text-sm text-amber-600 hover:text-amber-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Notify Me When Available
            </>
          )}
        </button>
      )}

      {message && !subscribed && (
        <p className="mt-2 text-sm text-(--color-error)">{message}</p>
      )}
    </div>
  )
}
