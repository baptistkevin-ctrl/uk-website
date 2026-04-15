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
  Store,
  Mail,
  Lock,
  ArrowRight,
  TrendingUp,
  Package,
  CreditCard,
  BarChart3,
  User,
  Building2,
  Briefcase,
  Phone,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

// ── Schemas ──

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  business_name: z.string().min(2, 'Business name is required'),
  business_type: z.string(),
  description: z.string().optional(),
  phone: z.string().optional(),
  website_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

const vendorBenefits = [
  { icon: Package, title: 'Product Management', description: 'Easily manage your product listings' },
  { icon: TrendingUp, title: 'Sales Analytics', description: 'Track your sales and performance' },
  { icon: CreditCard, title: 'Secure Payouts', description: 'Get paid directly via Stripe' },
  { icon: BarChart3, title: 'Growth Tools', description: 'Tools to help grow your business' },
]

const productCategories = [
  'Fruits & Vegetables', 'Meat & Poultry', 'Fish & Seafood', 'Dairy & Eggs',
  'Bakery', 'Frozen Foods', 'Pantry', 'Drinks', 'Snacks & Sweets',
  'Health & Beauty', 'Household', 'Other'
]

// ── Login Tab ──

function VendorLoginTab() {
  const router = useRouter()
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
      await signIn(data.email, data.password)

      // Check if user is a vendor
      const res = await fetch('/api/vendor/register')
      const vendorData = await res.json()

      if (vendorData.isVendor) {
        router.push('/vendor/dashboard')
        router.refresh()
      } else if (vendorData.application) {
        const status = vendorData.application.status
        if (status === 'pending') {
          setError('Your vendor application is still under review. We will notify you once it\'s approved.')
        } else if (status === 'rejected') {
          setError('Your vendor application was not approved. Please contact support for more information.')
        } else if (status === 'approved') {
          router.push('/vendor/onboarding')
        }
      } else {
        setError('This account is not registered as a vendor. Please use the Register tab to apply.')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-(--color-error-bg) border border-red-100 text-(--color-error) text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-foreground font-medium">Email Address</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled)">
            <Mail className="h-5 w-5" />
          </div>
          <Input
            id="login-email"
            type="email"
            placeholder="vendor@example.com"
            className="pl-10 h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
            {...register('email')}
          />
        </div>
        {errors.email && <p className="text-sm text-(--color-error)">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-foreground font-medium">Password</Label>
          <Link href="/forgot-password" className="text-sm text-(--color-info) hover:text-(--color-info) font-medium">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled)">
            <Lock className="h-5 w-5" />
          </div>
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className="pl-10 pr-10 h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled) hover:text-(--color-text-secondary)"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-(--color-error)">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-500/25"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Sign In to Vendor Portal
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  )
}

// ── Register Tab ──

function VendorRegisterTab() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      business_type: 'sole_trader',
    },
  })

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null)

      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          business_name: data.business_name,
          business_type: data.business_type,
          description: data.description,
          phone: data.phone,
          website_url: data.website_url || undefined,
          product_categories: selectedCategories,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Failed to register')
        return
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError('Something went wrong. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-(--brand-primary)" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h3>
        <p className="text-(--color-text-secondary) mb-2">
          Please check your email to verify your account.
        </p>
        <p className="text-(--color-text-muted) text-sm mb-6">
          Our team will review your vendor application and notify you once it's approved. This usually takes 1-2 business days.
        </p>
        <div className="p-4 bg-(--color-info-bg) border border-purple-100 rounded-xl text-sm text-(--color-info)">
          <strong>What happens next?</strong>
          <ol className="mt-2 text-left space-y-1 list-decimal list-inside">
            <li>Verify your email address</li>
            <li>We review your vendor application</li>
            <li>Once approved, sign in to set up your store</li>
            <li>Connect your payment account and start selling</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-(--color-error-bg) border border-red-100 text-(--color-error) text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── Account Details ── */}
      <div className="pb-4 border-b border-(--color-border)">
        <h3 className="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wide mb-4">Account Details</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name" className="text-foreground font-medium">Full Name *</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled)">
                <User className="h-5 w-5" />
              </div>
              <Input
                id="reg-name"
                placeholder="John Smith"
                className="pl-10 h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
                {...register('full_name')}
              />
            </div>
            {errors.full_name && <p className="text-sm text-(--color-error)">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email" className="text-foreground font-medium">Email Address *</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled)">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                id="reg-email"
                type="email"
                placeholder="vendor@example.com"
                className="pl-10 h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-sm text-(--color-error)">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-foreground font-medium">Password *</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled)">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  className="pl-10 h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-sm text-(--color-error)">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm" className="text-foreground font-medium">Confirm Password *</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled)">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  className="pl-10 h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
                  {...register('confirm_password')}
                />
              </div>
              {errors.confirm_password && <p className="text-sm text-(--color-error)">{errors.confirm_password.message}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-(--color-text-muted) hover:text-foreground"
          >
            {showPassword ? 'Hide' : 'Show'} passwords
          </button>
        </div>
      </div>

      {/* ── Business Details ── */}
      <div className="pb-4 border-b border-(--color-border)">
        <h3 className="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wide mb-4">Business Details</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-business" className="text-foreground font-medium">Business Name *</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled)">
                <Building2 className="h-5 w-5" />
              </div>
              <Input
                id="reg-business"
                placeholder="Your business or store name"
                className="pl-10 h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
                {...register('business_name')}
              />
            </div>
            {errors.business_name && <p className="text-sm text-(--color-error)">{errors.business_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reg-type" className="text-foreground font-medium">
                <Briefcase className="h-4 w-4 inline mr-1" />
                Business Type
              </Label>
              <select
                id="reg-type"
                className="w-full h-12 px-3 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                {...register('business_type')}
              >
                <option value="sole_trader">Sole Trader</option>
                <option value="limited_company">Limited Company</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone" className="text-foreground font-medium">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number
              </Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="+44 7XXX XXXXXX"
                className="h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-desc" className="text-foreground font-medium">About Your Business</Label>
            <textarea
              id="reg-desc"
              placeholder="What products do you sell? What makes your business unique?"
              rows={3}
              className="w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-website" className="text-foreground font-medium">
              <Globe className="h-4 w-4 inline mr-1" />
              Website (optional)
            </Label>
            <Input
              id="reg-website"
              type="url"
              placeholder="https://yourwebsite.com"
              className="h-12 border-(--color-border) focus:border-purple-500 focus:ring-purple-500"
              {...register('website_url')}
            />
          </div>
        </div>
      </div>

      {/* ── Product Categories ── */}
      <div>
        <h3 className="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wide mb-3">What will you sell?</h3>
        <div className="flex flex-wrap gap-2">
          {productCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategories.includes(category)
                  ? 'bg-(--color-info) text-white'
                  : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-500/25"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            Create Account & Apply as Vendor
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      <p className="text-xs text-(--color-text-muted) text-center">
        By registering, you agree to our seller terms and conditions.
      </p>
    </form>
  )
}

// ── Main Page ──

export default function VendorLoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-(--color-surface)">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
                <Store className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Vendor Portal
              </span>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-(--color-elevated) rounded-xl p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-(--color-surface) text-(--color-info) shadow-sm'
                  : 'text-(--color-text-muted) hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-(--color-surface) text-(--color-info) shadow-sm'
                  : 'text-(--color-text-muted) hover:text-foreground'
              }`}
            >
              Register as Vendor
            </button>
          </div>

          {/* Tab Content */}
          <Card className="border-(--color-border) shadow-xl shadow-(--shadow-sm)">
            <CardContent className="p-6 sm:p-8">
              {activeTab === 'login' ? <VendorLoginTab /> : <VendorRegisterTab />}
            </CardContent>
          </Card>

          {/* Customer login link */}
          <p className="text-center text-sm text-(--color-text-muted) mt-6">
            Looking for customer login?{' '}
            <Link href="/login" className="text-(--color-info) hover:text-(--color-info) font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex lg:flex-1 bg-linear-to-br from-purple-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-(--color-surface)/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-300/10 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center w-full px-12">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4">
              {activeTab === 'login' ? 'Welcome Back, Vendor' : 'Start Selling Today'}
            </h2>
            <p className="text-purple-100 text-lg mb-8">
              {activeTab === 'login'
                ? 'Access your vendor dashboard to manage products, track orders, and grow your sales.'
                : 'Create your vendor account and apply in one step. No separate registration needed.'}
            </p>

            <div className="space-y-4">
              {vendorBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-(--color-surface)/10 backdrop-blur-sm rounded-xl border border-white/20"
                >
                  <div className="w-12 h-12 bg-(--color-surface)/20 rounded-xl flex items-center justify-center shrink-0">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                    <p className="text-sm text-purple-100">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-(--color-surface)/10 rounded-xl">
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-sm text-purple-200">Active Vendors</p>
              </div>
              <div className="text-center p-4 bg-(--color-surface)/10 rounded-xl">
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="text-sm text-purple-200">Products</p>
              </div>
              <div className="text-center p-4 bg-(--color-surface)/10 rounded-xl">
                <p className="text-2xl font-bold text-white">15%</p>
                <p className="text-sm text-purple-200">Commission</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
