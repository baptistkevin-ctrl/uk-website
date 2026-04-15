'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye,
  EyeOff,
  Loader2,
  Truck,
  Shield,
  Clock,
  Sparkles,
  Mail,
  Lock,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { SocialLoginButtons } from '@/components/auth/social-login-buttons'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const benefits = [
  { icon: Clock, title: 'Order History', desc: 'Track all your orders' },
  { icon: Truck, title: 'Fast Checkout', desc: 'Saved addresses & payments' },
  { icon: Shield, title: 'Exclusive Deals', desc: 'Member-only offers' },
  { icon: Sparkles, title: 'Priority Support', desc: 'Faster help with orders' },
]

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null)
      const { user } = await signIn(data.email, data.password)

      const redirectParam = searchParams.get('redirectTo')
      if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
        window.location.href = redirectParam
        return
      }

      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const profile = await res.json()
        if (profile.role === 'admin' || profile.role === 'super_admin') {
          window.location.href = '/admin'
        } else if (profile.is_vendor || profile.role === 'vendor') {
          window.location.href = '/vendor/dashboard'
        } else {
          window.location.href = '/'
        }
      } else {
        window.location.href = '/'
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* ─── Left Panel — Desktop Only ─── */}
      <div className="hidden lg:flex lg:w-[45%] bg-(--brand-dark) relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute top-20 -left-20 w-60 h-60 bg-(--brand-primary)/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-(--brand-amber)/15 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-xl bg-(--brand-primary) flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">UK Grocery</span>
          </Link>

          <h2 className="font-display text-3xl xl:text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Welcome back,
            <br />
            <span className="text-(--brand-amber)">let&apos;s shop fresh.</span>
          </h2>
          <p className="mt-4 text-white/50 text-sm max-w-sm">
            Sign in to access your orders, saved lists, and exclusive member deals.
          </p>

          {/* Benefits grid */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                <b.icon className="h-5 w-5 text-(--brand-amber) shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel — Form ─── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-105">
          {/* Mobile header with brand */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="h-10 w-10 rounded-xl bg-(--brand-primary) flex items-center justify-center shadow-md">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-(--brand-dark)">UK Grocery</span>
            </Link>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
            <p className="mt-1 text-sm text-(--color-text-muted)">
              Welcome back — pick up where you left off.
            </p>
          </div>

          {/* Mobile header */}
          <div className="lg:hidden mb-6">
            <h1 className="text-xl font-bold text-foreground">Sign in to your account</h1>
            <p className="mt-1 text-sm text-(--color-text-muted)">
              Welcome back — pick up where you left off.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="text-sm text-(--color-error) bg-(--color-error-bg) rounded-xl p-3.5 flex items-center gap-2.5 border border-(--color-error)/10">
                <div className="h-6 w-6 rounded-full bg-(--color-error)/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-(--color-error)">!</span>
                </div>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-(--color-text-muted)" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-12 rounded-xl border border-(--color-border) bg-(--color-surface) pl-11 pr-4 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/20 transition-all"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-(--color-error)">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-(--brand-primary) hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-(--color-text-muted)" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-12 rounded-xl border border-(--color-border) bg-(--color-surface) pl-11 pr-12 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/20 transition-all"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-lg text-(--color-text-muted) hover:text-foreground hover:bg-(--color-elevated) transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-(--color-error)">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-(--brand-primary) hover:bg-(--brand-primary-hover) text-white font-semibold text-sm shadow-[0_4px_16px_rgba(27,107,58,0.3)] hover:shadow-[0_8px_24px_rgba(27,107,58,0.4)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--color-border)" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-(--color-text-muted)">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <SocialLoginButtons />

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-(--color-text-muted)">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-(--brand-primary) font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>

          {/* Mobile benefits strip */}
          <div className="lg:hidden mt-8 pt-6 border-t border-(--color-border)">
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-(--color-text-muted)">
                  <b.icon className="h-4 w-4 text-(--brand-primary) shrink-0" />
                  <span>{b.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
