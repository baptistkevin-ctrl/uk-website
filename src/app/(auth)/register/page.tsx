'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye,
  EyeOff,
  Loader2,
  Truck,
  Shield,
  Tag,
  Heart,
  Mail,
  Lock,
  User,
  CheckCircle2,
  Check,
  X,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { SocialLoginButtons } from '@/components/auth/social-login-buttons'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

const benefits = [
  { icon: Truck, title: 'Free Delivery', description: 'On orders over \u00a350' },
  { icon: Tag, title: 'Exclusive Deals', description: 'Member-only discounts and offers' },
  { icon: Shield, title: 'Order Tracking', description: 'Real-time updates on every order' },
  { icon: Heart, title: 'Wishlist', description: 'Save your favourite products for later' },
]

const passwordRequirements = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[a-z]/, label: 'One lowercase letter' },
  { regex: /[0-9]/, label: 'One number' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password', '')

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null)
      await signUp(data.email, data.password, data.fullName)
      setSuccess(true)
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to create account'
      const code = (err as { code?: string })?.code ?? ''

      const friendlyMessages: Record<string, string> = {
        email_address_invalid: 'Please use a valid email address (e.g. yourname@gmail.com).',
        user_already_exists: 'An account with this email already exists. Try signing in instead.',
        over_request_rate_limit: 'Too many attempts. Please wait a minute and try again.',
        weak_password: 'Password is too weak. Please use a stronger password.',
        signup_disabled: 'Registration is currently disabled. Please try again later.',
      }

      setError(friendlyMessages[code] ?? raw)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md bg-(--color-surface) rounded-2xl p-8 text-center shadow-(--shadow-md)">
          <div className="w-16 h-16 bg-(--brand-primary)/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-(--brand-primary)" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Check your email</h2>
          <p className="text-sm text-(--color-text-muted) mb-6">
            We&apos;ve sent you a confirmation link. Please check your email to verify your account.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-(--brand-amber) hover:bg-(--brand-amber-hover) text-(--brand-dark) font-semibold text-sm shadow-(--shadow-amber) transition-[background-color,box-shadow] duration-200 ease-(--ease-premium)"
          >
            Back to Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl mx-auto grid lg:grid-cols-2 gap-0">
        {/* Left Panel - Benefits */}
        <div className="hidden lg:flex flex-col justify-center bg-(--brand-dark) rounded-l-(--radius-2xl) p-8 lg:p-10">
          <h2 className="font-display text-3xl font-semibold text-white">
            Create your account
          </h2>
          <p className="mt-3 text-white/60 text-sm">
            Join thousands of shoppers enjoying fresh groceries delivered to their door.
          </p>

          <div className="mt-8 space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-(--color-surface)/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">{benefit.title}</h3>
                  <p className="text-xs text-white/60 mt-0.5">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="bg-(--color-surface) rounded-2xl lg:rounded-l-none p-6 lg:p-8">
          {/* Logo */}
          <Link href="/" className="inline-block mb-6">
            <span className="font-display text-xl text-(--brand-dark)">UK Grocery</span>
          </Link>

          <h1 className="text-xl font-semibold text-foreground">
            Create an account
          </h1>
          <p className="mt-1 text-sm text-(--color-text-muted) mb-6">
            Start shopping fresh groceries today.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="text-sm text-(--color-error) bg-(--color-error)/5 rounded-lg p-3 flex items-center gap-2">
                <span className="shrink-0 font-bold">!</span>
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Smith"
                  className="w-full h-11 rounded-lg border border-(--color-border) bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none focus:border-(--brand-primary) focus:ring-1 focus:ring-(--brand-primary) transition-[border-color,box-shadow] duration-200"
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-(--color-error)">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-lg border border-(--color-border) bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none focus:border-(--brand-primary) focus:ring-1 focus:ring-(--brand-primary) transition-[border-color,box-shadow] duration-200"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-(--color-error)">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className="w-full h-11 rounded-lg border border-(--color-border) bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none focus:border-(--brand-primary) focus:ring-1 focus:ring-(--brand-primary) transition-[border-color,box-shadow] duration-200"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text-secondary) transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {passwordRequirements.map((req, index) => {
                    const isValid = req.regex.test(password)
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-1.5 text-xs ${
                          isValid ? 'text-(--brand-primary)' : 'text-(--color-text-muted)'
                        }`}
                      >
                        {isValid ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        {req.label}
                      </div>
                    )
                  })}
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-(--color-error)">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full h-11 rounded-lg border border-(--color-border) bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none focus:border-(--brand-primary) focus:ring-1 focus:ring-(--brand-primary) transition-[border-color,box-shadow] duration-200"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-(--color-error)">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-sm text-(--color-text-muted)">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-(--brand-primary) hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-(--brand-primary) hover:underline">
                Privacy Policy
              </Link>
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-(--brand-amber) hover:bg-(--brand-amber-hover) text-(--brand-dark) font-semibold text-sm shadow-(--shadow-amber) transition-[background-color,box-shadow] duration-200 ease-(--ease-premium) disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--color-border)" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-(--color-surface) px-3 text-(--color-text-muted)">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <SocialLoginButtons />

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-(--color-text-muted)">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-(--brand-primary) font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
