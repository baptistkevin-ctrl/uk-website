'use client'

import { useState } from 'react'
import { Mail, Check, Loader2 } from 'lucide-react'

interface NewsletterFormProps {
  source?: string
  className?: string
  variant?: 'default' | 'compact' | 'inline'
}

export function NewsletterForm({ source = 'website', className = '', variant = 'default' }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: firstName || undefined,
          source
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setEmail('')
        setFirstName('')
      } else {
        setError(data.error || 'Failed to subscribe')
      }
    } catch (err) {
      setError('Failed to subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-3 p-4 bg-(--brand-primary-light) border border-(--brand-primary) rounded-lg text-(--brand-primary)">
          <Check className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Successfully subscribed!</p>
            <p className="text-sm text-(--brand-primary)">Thank you for joining our newsletter.</p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className={`${className}`}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-(--color-text-disabled)" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Subscribe'}
          </button>
        </div>
        {error && <p className="text-(--color-error) text-sm mt-2">{error}</p>}
      </form>
    )
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={`${className}`}>
        <div className="flex">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 px-4 py-2 border border-r-0 rounded-l-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) focus:z-10"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-(--brand-primary) text-white rounded-r-lg hover:bg-(--brand-primary-hover) disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Subscribe'}
          </button>
        </div>
        {error && <p className="text-(--color-error) text-sm mt-2">{error}</p>}
      </form>
    )
  }

  // Default variant
  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white/80">
          <Mail className="h-5 w-5" />
          <span className="font-medium">Subscribe to our newsletter</span>
        </div>
        <p className="text-sm text-(--color-text-disabled)">
          Get exclusive deals, new product updates, and weekly specials delivered to your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name (optional)"
            className="px-4 py-2.5 bg-(--color-surface)/10 border border-white/20 rounded-lg text-white placeholder:text-(--color-text-disabled) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="flex-1 px-4 py-2.5 bg-(--color-surface)/10 border border-white/20 rounded-lg text-white placeholder:text-(--color-text-disabled) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) disabled:opacity-50 font-medium"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Subscribe'}
          </button>
        </div>
        {error && <p className="text-(--color-error) text-sm">{error}</p>}
        <p className="text-xs text-(--color-text-disabled)">
          By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
        </p>
      </div>
    </form>
  )
}
