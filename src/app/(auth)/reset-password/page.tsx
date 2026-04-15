'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      // If there's a session from the recovery flow, it's valid
      setIsValidSession(!!session)
    }

    checkSession()
  }, [])

  const validatePassword = (pass: string) => {
    const requirements = [
      { test: pass.length >= 8, message: 'At least 8 characters' },
      { test: /[A-Z]/.test(pass), message: 'One uppercase letter' },
      { test: /[a-z]/.test(pass), message: 'One lowercase letter' },
      { test: /[0-9]/.test(pass), message: 'One number' },
    ]
    return requirements
  }

  const passwordRequirements = validatePassword(password)
  const isPasswordValid = passwordRequirements.every((req) => req.test)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        // Sign out and redirect to login after 3 seconds
        setTimeout(async () => {
          await supabase.auth.signOut()
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full">
          <div className="bg-(--color-surface) rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-(--color-error-bg) rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-(--color-error)" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Invalid or expired link</h1>
            <p className="text-(--color-text-secondary) mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center w-full bg-(--brand-primary) text-white py-3 px-4 rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full">
          <div className="bg-(--color-surface) rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-(--brand-primary)" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Password reset successful!</h1>
            <p className="text-(--color-text-secondary) mb-6">
              Your password has been updated. You'll be redirected to login shortly.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full bg-(--brand-primary) text-white py-3 px-4 rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
            >
              Go to login
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
              <Lock className="h-8 w-8 text-(--brand-primary)" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
            <p className="text-(--color-text-secondary) mt-2">
              Enter your new password below
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
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full h-11 px-4 pr-12 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary) transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-(--color-text-muted) hover:text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="mt-3 space-y-2">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        req.test ? 'text-(--brand-primary)' : 'text-(--color-text-muted)'
                      }`}
                    >
                      <CheckCircle className={`h-4 w-4 ${req.test ? 'opacity-100' : 'opacity-30'}`} />
                      {req.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full h-11 px-4 pr-12 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary) transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-(--color-text-muted) hover:text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-(--color-error)">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || password !== confirmPassword}
              className="w-full bg-(--brand-primary) text-white py-3 px-4 rounded-lg font-medium hover:bg-(--brand-primary-hover) focus:ring-2 focus:ring-(--brand-primary) focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
