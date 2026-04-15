'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Check, AlertCircle, ArrowLeft } from 'lucide-react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'loading' | 'confirm' | 'success' | 'error'>('confirm')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleUnsubscribe = async () => {
    if (!email) {
      setError('Email is required')
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch(`/api/newsletter?email=${encodeURIComponent(email)}&reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        setStatus('success')
      } else {
        setError(data.error || 'Failed to unsubscribe')
        setStatus('error')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setStatus('error')
    }
  }

  if (!email) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-(--color-error-bg) rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-(--color-error)" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Request</h1>
          <p className="text-(--color-text-secondary) mb-6">
            No email address provided. Please use the unsubscribe link from your email.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-(--brand-primary) hover:text-(--brand-primary-hover)"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to homepage
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-(--brand-primary)" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Unsubscribed Successfully</h1>
          <p className="text-(--color-text-secondary) mb-6">
            You have been unsubscribed from our newsletter. You will no longer receive marketing emails from us.
          </p>
          <p className="text-sm text-(--color-text-muted) mb-6">
            Changed your mind? You can always subscribe again on our website.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover)"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to homepage
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-(--color-error-bg) rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-(--color-error)" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Unsubscribe Failed</h1>
          <p className="text-(--color-text-secondary) mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStatus('confirm')}
              className="px-6 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:bg-background"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-6 py-2 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover)"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-(--color-elevated) rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-(--color-text-secondary)" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Unsubscribe from Newsletter</h1>
          <p className="text-(--color-text-secondary)">
            Are you sure you want to unsubscribe <strong>{email}</strong> from our newsletter?
          </p>
        </div>

        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-(--color-text-secondary) mb-2">
              Help us improve (optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            >
              <option value="">Select a reason...</option>
              <option value="too_frequent">Too many emails</option>
              <option value="not_relevant">Content not relevant</option>
              <option value="never_subscribed">I never subscribed</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:bg-background text-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleUnsubscribe}
              disabled={status === 'loading'}
              className="flex-1 px-4 py-2.5 bg-(--color-error) text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Unsubscribing...' : 'Unsubscribe'}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-(--color-text-muted) mt-4">
          Note: You may still receive transactional emails about your orders.
        </p>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brand-primary)"></div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
