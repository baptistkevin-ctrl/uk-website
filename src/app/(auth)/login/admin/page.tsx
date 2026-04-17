'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        await supabase.auth.signOut()
        setError('Access denied. This login is for administrators only.')
        setLoading(false)
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-(--brand-dark) flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(27,107,58,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(232,134,26,0.2) 0%, transparent 50%)',
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-(--brand-primary) mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-white/50 text-sm mt-1">UK Grocery Store — Secure Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-(--color-surface) rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-(--color-error)/5 border border-(--color-error)/20 rounded-xl">
                <AlertCircle className="h-5 w-5 text-(--color-error) shrink-0 mt-0.5" />
                <p className="text-sm text-(--color-error)">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-muted)" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@ukgrocerystore.com"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-(--color-border) bg-background text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-muted)" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full h-12 pl-11 pr-12 rounded-xl border border-(--color-border) bg-background text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-(--brand-primary) text-white font-semibold hover:bg-(--brand-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Sign In to Admin
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-(--color-border)">
            <div className="flex items-start gap-2 text-xs text-(--color-text-muted)">
              <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>This is a restricted area. Unauthorised access attempts are logged and monitored. Only approved administrators can access this portal.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/30 mt-6">
          UK Grocery Store &copy; {new Date().getFullYear()} — Admin Portal
        </p>
      </div>
    </div>
  )
}
