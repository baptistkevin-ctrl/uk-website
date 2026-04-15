'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error && !error.message.toLowerCase().includes('user not found')) {
        // Only surface genuine technical errors, not account existence info
        setError('An unexpected error occurred. Please try again.')
      } else {
        // Always show success whether the email exists or not
        setIsSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full">
          <div className="bg-(--color-surface) rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-(--brand-primary)" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
            <p className="text-(--color-text-secondary) mb-6">
              If an account exists with that email, you'll receive a password reset link.
            </p>
            <p className="text-sm text-(--color-text-muted) mb-6">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSuccess(false)}
                className="text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium"
              >
                try again
              </button>
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="bg-(--color-surface) rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-(--brand-primary)" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
            <p className="text-(--color-text-secondary) mt-2">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-(--color-error-bg) border border-(--color-error-border) rounded-lg text-(--color-error) text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full h-11 px-4 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary) transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-(--brand-primary) text-white px-4 rounded-lg font-medium hover:bg-(--brand-primary-hover) focus:ring-2 focus:ring-(--brand-primary)/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-(--color-text-secondary) hover:text-(--brand-primary) transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
