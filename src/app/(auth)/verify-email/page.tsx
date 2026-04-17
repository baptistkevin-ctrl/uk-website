'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function VerifyEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending')
  const [email, setEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkVerification = async () => {
      const supabase = createClient()

      // Check if this is a callback from email verification
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const code = searchParams.get('code')

      // Handle token_hash verification (supports email, signup, and invite types)
      if (token_hash && type) {
        setStatus('verifying')
        try {
          const otpType = type === 'invite' ? 'invite' : type === 'signup' ? 'signup' : 'email'
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: otpType,
          })

          if (error) {
            setStatus('error')
            setError(error.message)
          } else {
            setStatus('success')
          }
        } catch (err) {
          setStatus('error')
          setError('Verification failed. Please try again.')
        }
        return
      }

      // Handle code exchange (PKCE flow)
      if (code) {
        setStatus('verifying')
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setStatus('error')
            setError(error.message)
          } else {
            setStatus('success')
          }
        } catch (err) {
          setStatus('error')
          setError('Verification failed. Please try again.')
        }
        return
      }

      // Handle hash fragment (implicit flow - #access_token=...)
      // Supabase client auto-detects hash fragments via onAuthStateChange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setStatus('success')
          subscription.unsubscribe() // Clean up immediately on success
        }
      })

      // Check if user is already verified
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || null)
        if (user.email_confirmed_at) {
          setStatus('success')
          subscription.unsubscribe()
        }
      }

      // Cleanup subscription after timeout if nothing happens
      const timeout = setTimeout(() => {
        subscription.unsubscribe()
      }, 30000) // 30 seconds

      return () => {
        clearTimeout(timeout)
        subscription.unsubscribe()
      }
    }

    checkVerification()
  }, [searchParams, router])

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        setError(error.message)
      } else {
        setResendSuccess(true)
      }
    } catch (err) {
      setError('Failed to resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  // Verifying state
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full">
          <div className="bg-(--color-surface) rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-(--brand-primary) mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verifying your email...</h1>
            <p className="text-(--color-text-secondary)">Please wait while we verify your email address.</p>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full">
          <div className="bg-(--color-surface) rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-(--color-success)/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-(--color-success)" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to UK Grocery!</h1>
            <p className="text-(--color-text-secondary) mb-6">
              Your email has been verified. You're all set to start shopping fresh groceries delivered to your door.
            </p>

            <div className="bg-background rounded-xl p-4 mb-6 text-left space-y-3 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-(--brand-primary)/10 flex items-center justify-center shrink-0">
                  <span className="text-sm">🎉</span>
                </div>
                <p className="text-sm text-(--color-text-secondary)"><span className="font-semibold text-foreground">100 loyalty points</span> added to your account</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-(--brand-primary)/10 flex items-center justify-center shrink-0">
                  <span className="text-sm">🚚</span>
                </div>
                <p className="text-sm text-(--color-text-secondary)"><span className="font-semibold text-foreground">Free delivery</span> on your first order over £40</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-(--brand-primary)/10 flex items-center justify-center shrink-0">
                  <span className="text-sm">💰</span>
                </div>
                <p className="text-sm text-(--color-text-secondary)">Check out today's <span className="font-semibold text-foreground">exclusive deals</span></p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center w-full bg-(--brand-primary) text-white py-3 px-4 rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
            >
              Start Shopping
            </Link>
            <Link
              href="/deals"
              className="inline-flex items-center justify-center w-full mt-3 bg-background text-(--color-text-secondary) py-3 px-4 rounded-lg font-medium hover:bg-(--color-border) transition-colors border border-(--color-border)"
            >
              View Today's Deals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full">
          <div className="bg-(--color-surface) rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-(--color-error-bg) rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-(--color-error)" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verification failed</h1>
            <p className="text-(--color-text-secondary) mb-6">
              {error || 'The verification link is invalid or has expired.'}
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full bg-(--brand-primary) text-white py-3 px-4 rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
              >
                Go to login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full bg-background text-(--color-text-secondary) py-3 px-4 rounded-lg font-medium hover:bg-(--color-border) transition-colors"
              >
                Create new account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Pending state - waiting for verification
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="bg-(--color-surface) rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-(--brand-primary)" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Verify your email</h1>
          <p className="text-(--color-text-secondary) mb-6">
            {email ? (
              <>
                We've sent a verification link to{' '}
                <span className="font-medium text-foreground">{email}</span>
              </>
            ) : (
              'Please check your email for the verification link.'
            )}
          </p>

          {/* Resend success message */}
          {resendSuccess && (
            <div className="mb-6 p-4 bg-(--brand-primary-light) border border-(--brand-primary)/20 rounded-lg text-(--brand-primary) text-sm">
              Verification email sent! Check your inbox.
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-(--color-error-bg) border border-(--color-error-border) rounded-lg text-(--color-error) text-sm">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-background rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-foreground mb-2">Next steps:</h3>
            <ol className="text-sm text-(--color-text-secondary) space-y-2">
              <li>1. Check your email inbox</li>
              <li>2. Click the verification link</li>
              <li>3. Start shopping!</li>
            </ol>
          </div>

          {/* Resend button */}
          {email && (
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="inline-flex items-center justify-center gap-2 text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Resend verification email
                </>
              )}
            </button>
          )}

          {/* Divider */}
          <div className="my-6 border-t border-(--color-border)"></div>

          {/* Back to login */}
          <p className="text-sm text-(--color-text-muted)">
            Wrong email?{' '}
            <Link href="/register" className="text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium">
              Sign up again
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function VerifyEmailPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-(--brand-primary) mb-4" />
        <p className="text-(--color-text-muted)">Loading...</p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailPageLoading />}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}
