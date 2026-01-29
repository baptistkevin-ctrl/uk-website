'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Tag,
  Package,
  Heart,
  Loader2,
  CheckCircle,
  Save,
  ArrowLeft
} from 'lucide-react'

interface NotificationPreferences {
  email_order_updates: boolean
  email_promotions: boolean
  email_price_drops: boolean
  email_newsletter: boolean
  push_order_updates: boolean
  push_promotions: boolean
  push_price_drops: boolean
  sms_order_updates: boolean
  sms_promotions: boolean
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_order_updates: true,
    email_promotions: true,
    email_price_drops: true,
    email_newsletter: true,
    push_order_updates: true,
    push_promotions: true,
    push_price_drops: true,
    sms_order_updates: false,
    sms_promotions: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/notifications/preferences')
      if (res.ok) {
        const data = await res.json()
        if (data.preferences) {
          setPreferences({
            email_order_updates: data.preferences.email_order_updates ?? true,
            email_promotions: data.preferences.email_promotions ?? true,
            email_price_drops: data.preferences.email_price_drops ?? true,
            email_newsletter: data.preferences.email_newsletter ?? true,
            push_order_updates: data.preferences.push_order_updates ?? true,
            push_promotions: data.preferences.push_promotions ?? true,
            push_price_drops: data.preferences.push_price_drops ?? true,
            sms_order_updates: data.preferences.sms_order_updates ?? false,
            sms_promotions: data.preferences.sms_promotions ?? false,
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save preferences')
      }
    } catch (err) {
      setError('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({
    checked,
    onChange,
    disabled
  }: {
    checked: boolean
    onChange: () => void
    disabled?: boolean
  }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-green-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-6' : ''
        }`}
      />
    </button>
  )

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
        <p className="mt-2 text-gray-500">Loading preferences...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/account/notifications"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notifications
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-6 w-6 text-green-600" />
          Notification Settings
        </h1>
        <p className="text-gray-500 mt-1">Choose how you want to receive notifications</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6">
          <CheckCircle className="h-5 w-5" />
          Notification preferences saved!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Email Notifications */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Email Notifications</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Order Updates</p>
                <p className="text-sm text-gray-500">
                  Order confirmations, shipping updates, and delivery notifications
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.email_order_updates}
              onChange={() => handleToggle('email_order_updates')}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Promotions & Deals</p>
                <p className="text-sm text-gray-500">
                  Special offers, discounts, and flash deals
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.email_promotions}
              onChange={() => handleToggle('email_promotions')}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Price Drop Alerts</p>
                <p className="text-sm text-gray-500">
                  Get notified when wishlist items go on sale
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.email_price_drops}
              onChange={() => handleToggle('email_price_drops')}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Newsletter</p>
                <p className="text-sm text-gray-500">
                  Weekly updates, new products, and recipes
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.email_newsletter}
              onChange={() => handleToggle('email_newsletter')}
            />
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Push Notifications</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Order Updates</p>
                <p className="text-sm text-gray-500">
                  Real-time push notifications for order updates
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.push_order_updates}
              onChange={() => handleToggle('push_order_updates')}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Promotions & Deals</p>
                <p className="text-sm text-gray-500">
                  Flash deal alerts and limited-time offers
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.push_promotions}
              onChange={() => handleToggle('push_promotions')}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Price Drop Alerts</p>
                <p className="text-sm text-gray-500">
                  Get notified when wishlist items drop in price
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.push_price_drops}
              onChange={() => handleToggle('push_price_drops')}
            />
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">SMS Notifications</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Order Updates</p>
                <p className="text-sm text-gray-500">
                  SMS alerts for order status changes and delivery
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.sms_order_updates}
              onChange={() => handleToggle('sms_order_updates')}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Promotions</p>
                <p className="text-sm text-gray-500">
                  Exclusive SMS-only offers and deals
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences.sms_promotions}
              onChange={() => handleToggle('sms_promotions')}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Some notifications like order confirmations and security alerts
          cannot be disabled as they contain important account information.
        </p>
      </div>
    </div>
  )
}
