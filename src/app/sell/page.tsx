'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Store,
  TrendingUp,
  CreditCard,
  Shield,
  Users,
  Package,
  CheckCircle,
  ArrowRight,
  Loader2,
  Building2,
  Briefcase,
  Globe,
  Phone,
  Zap,
  BarChart3,
  Truck,
  Star,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

const benefits = [
  { icon: Users, title: 'Reach Thousands', desc: 'Access our growing customer base across the UK', stat: '50K+', statLabel: 'Active Shoppers' },
  { icon: CreditCard, title: 'Fast Payouts', desc: 'Get paid weekly via Stripe with automatic transfers', stat: '£0', statLabel: 'Monthly Fees' },
  { icon: Package, title: 'Easy Management', desc: 'Powerful vendor dashboard for products & orders', stat: '5min', statLabel: 'Setup Time' },
  { icon: TrendingUp, title: 'Grow Revenue', desc: 'Analytics and insights to optimize your sales', stat: '85%', statLabel: 'Seller Satisfaction' },
  { icon: Shield, title: 'Trusted Platform', desc: 'Secure payments and buyer protection built in', stat: '99.9%', statLabel: 'Uptime' },
  { icon: BarChart3, title: 'Real Analytics', desc: 'Track sales, views, and trends in real-time', stat: '24/7', statLabel: 'Support' },
]

const steps = [
  { num: '01', title: 'Apply', desc: 'Fill out a quick application with your business details' },
  { num: '02', title: 'Get Approved', desc: 'Our team reviews your application within 24 hours' },
  { num: '03', title: 'List Products', desc: 'Upload your products with photos and pricing' },
  { num: '04', title: 'Start Selling', desc: 'Orders come in and you get paid weekly' },
]

const categories = [
  'Fruits & Vegetables', 'Meat & Poultry', 'Fish & Seafood', 'Dairy & Eggs',
  'Bakery', 'Frozen Foods', 'Pantry', 'Drinks',
  'Snacks & Sweets', 'Health & Beauty', 'Household', 'Other'
]

export default function SellPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [checking, setChecking] = useState(true)
  const [existingStatus, setExistingStatus] = useState<{
    isVendor: boolean
    application: { status: string } | null
  } | null>(null)

  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'sole_trader',
    description: '',
    product_categories: [] as string[],
    expected_monthly_sales: '',
    website_url: '',
    phone: '',
    // Registration fields (only used when not logged in)
    full_name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) { setChecking(false); return }
      try {
        const res = await fetch('/api/vendor/register')
        const data = await res.json()
        setExistingStatus(data)
      } catch {
        // silently fail
      } finally {
        setChecking(false)
      }
    }
    checkStatus()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate registration fields for new users
    if (!user) {
      if (!formData.full_name.trim()) { toast.error('Full name is required'); return }
      if (!formData.email.trim()) { toast.error('Email is required'); return }
      if (formData.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user ? formData : {
          ...formData,
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.error(data.error || 'Failed to submit application')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      product_categories: prev.product_categories.includes(category)
        ? prev.product_categories.filter(c => c !== category)
        : [...prev.product_categories, category]
    }))
  }

  const handleStartSelling = () => {
    setShowForm(true)
    setTimeout(() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  // Application submitted successfully
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-20 px-4">
        <div className="max-w-lg w-full bg-(--color-surface) rounded-2xl p-10 shadow-lg text-center border border-(--color-border)">
          <div className="w-20 h-20 bg-(--color-success)/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-(--color-success)" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Application Submitted!
          </h1>
          <p className="text-(--color-text-muted) mb-8 leading-relaxed">
            Thank you for applying to sell on UK Grocery. Our team will review your application
            and get back to you within <span className="font-semibold text-foreground">1-2 business days</span>.
          </p>
          <div className="bg-background rounded-xl p-5 mb-8 border border-(--color-border) text-left space-y-3">
            <h3 className="font-semibold text-foreground text-sm">What happens next?</h3>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-(--brand-primary)/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-(--brand-primary)">1</span>
              </div>
              <p className="text-sm text-(--color-text-muted)">We review your business details and product categories</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-(--brand-primary)/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-(--brand-primary)">2</span>
              </div>
              <p className="text-sm text-(--color-text-muted)">You'll receive an email with your approval status</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-(--brand-primary)/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-(--brand-primary)">3</span>
              </div>
              <p className="text-sm text-(--color-text-muted)">Once approved, set up your store and start selling</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Back to Home
              </Button>
            </Link>
            <Link href="/account" className="flex-1">
              <Button size="lg" className="w-full">
                My Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Already a vendor
  if (existingStatus?.isVendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-(--color-surface) rounded-2xl p-8 shadow-lg text-center border border-(--color-border)">
          <div className="w-16 h-16 bg-(--color-success-bg) rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-(--color-success)" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">You're Already a Vendor!</h1>
          <p className="text-(--color-text-muted) mb-6">Access your dashboard to manage products and orders.</p>
          <Link href="/vendor/dashboard">
            <Button size="lg" className="w-full">
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Pending application
  if (existingStatus?.application) {
    const status = existingStatus.application.status
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-(--color-surface) rounded-2xl p-8 shadow-lg text-center border border-(--color-border)">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
            status === 'approved' ? 'bg-(--color-success-bg)' :
            status === 'rejected' ? 'bg-(--color-error-bg)' : 'bg-(--color-warning-bg)'
          }`}>
            {status === 'approved' ? <CheckCircle className="h-8 w-8 text-(--color-success)" /> :
             status === 'rejected' ? <Shield className="h-8 w-8 text-(--color-error)" /> :
             <Loader2 className="h-8 w-8 text-(--color-warning) animate-spin" />}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {status === 'approved' ? 'Application Approved!' :
             status === 'rejected' ? 'Application Not Approved' : 'Application Under Review'}
          </h1>
          <p className="text-(--color-text-muted) mb-6">
            {status === 'approved' ? 'Your vendor account is ready. Complete your store setup now.' :
             status === 'rejected' ? 'Unfortunately your application was not approved. Contact support for details.' :
             'We\'re reviewing your application. You\'ll be notified once it\'s processed.'}
          </p>
          {status === 'approved' && (
            <Link href="/vendor/onboarding">
              <Button size="lg" className="w-full">Complete Setup <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-(--brand-dark)">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,rgba(27,107,58,0.4),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(232,134,26,0.3),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
                <Zap className="h-4 w-4 text-(--brand-amber)" />
                <span className="text-sm font-medium text-white/80">Now accepting new sellers</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight">
                Sell Fresh on
                <br />
                <span className="text-(--brand-amber)">UK Grocery</span>
              </h1>

              <p className="mt-4 sm:mt-5 text-base sm:text-lg text-white/60 max-w-lg">
                Join our marketplace and reach thousands of customers across the UK.
                No monthly fees — just 15% commission on sales.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartSelling}
                  className="inline-flex items-center justify-center gap-2.5 h-14 px-8 rounded-2xl bg-white text-(--brand-dark) text-base font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Start Selling <ArrowRight className="h-5 w-5" />
                </button>
                <Link
                  href="/vendor/login"
                  className="inline-flex items-center justify-center gap-2.5 h-14 px-8 rounded-2xl bg-white/10 backdrop-blur-sm text-white text-base font-semibold hover:bg-white/20 transition-all"
                >
                  Vendor Login <ChevronRight className="h-5 w-5" />
                </Link>
              </div>

              {/* Trust strip */}
              <div className="mt-8 sm:mt-10 flex flex-wrap gap-4 sm:gap-6">
                {[
                  { icon: CreditCard, text: 'Weekly payouts' },
                  { icon: Truck, text: 'We handle delivery' },
                  { icon: Shield, text: 'Seller protection' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/50">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile stats strip */}
            <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
              {[
                { value: '500+', label: 'Sellers' },
                { value: '50K+', label: 'Orders/mo' },
                { value: '£0', label: 'Monthly fee' },
                { value: '4.8★', label: 'Rating' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="text-[11px] text-white/40">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Right — Stats card (desktop) */}
            <div className="hidden lg:block">
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: '500+', label: 'Active Sellers', icon: Store },
                    { value: '50K+', label: 'Monthly Orders', icon: Package },
                    { value: '£2M+', label: 'Seller Revenue', icon: TrendingUp },
                    { value: '4.8★', label: 'Seller Rating', icon: Star },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 rounded-2xl bg-white/5">
                      <stat.icon className="h-6 w-6 text-(--brand-amber) mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-(--brand-amber)/10 border border-(--brand-amber)/20">
                  <p className="text-sm text-(--brand-amber) font-semibold text-center">
                    Average seller earns £3,500/month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Why sellers choose <span className="text-(--brand-primary)">UK Grocery</span>
            </h2>
            <p className="mt-3 text-(--color-text-muted) max-w-xl mx-auto">
              Everything you need to succeed as a grocery seller, built right in.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="group bg-(--color-surface) border border-(--color-border) rounded-2xl p-6 hover:shadow-lg hover:border-(--brand-primary)/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-(--brand-primary)/10 flex items-center justify-center group-hover:bg-(--brand-primary)/15 transition-colors">
                    <b.icon className="h-6 w-6 text-(--brand-primary)" />
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{b.stat}</p>
                    <p className="text-[11px] text-(--color-text-muted)">{b.statLabel}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-(--color-text-muted)">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-16 lg:py-24 bg-(--color-surface)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Start selling in <span className="text-(--brand-amber)">4 easy steps</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-background border border-(--color-border) rounded-2xl p-6 text-center h-full">
                  <span className="font-display text-4xl font-bold text-(--brand-primary)/15">{step.num}</span>
                  <h3 className="text-lg font-bold text-foreground mt-2 mb-2">{step.title}</h3>
                  <p className="text-sm text-(--color-text-muted)">{step.desc}</p>
                </div>
                {i < 3 && (
                  <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 h-6 w-6 text-(--color-border) -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Application Form ─── */}
      {showForm && (
        <section className="py-16 lg:py-24 bg-background" id="register">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="bg-(--color-surface) rounded-2xl shadow-xl border border-(--color-border) overflow-hidden">
              <div className="bg-(--brand-dark) p-6 text-center">
                <Store className="h-8 w-8 text-(--brand-amber) mx-auto mb-2" />
                <h2 className="text-xl font-bold text-white">Seller Application</h2>
                <p className="text-sm text-white/50 mt-1">Takes less than 5 minutes</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                {/* Account creation fields — only shown when not logged in */}
                {!user && (
                  <div className="space-y-4 pb-5 mb-5 border-b border-(--color-border)">
                    <p className="text-sm font-medium text-foreground">Create your account</p>
                    <div>
                      <Label htmlFor="full_name" className="flex items-center gap-2 mb-1.5">Full Name *</Label>
                      <Input id="full_name" value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Your full name" required autoComplete="name" className="h-12" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-1.5">Email *</Label>
                      <Input id="email" type="email" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com" required autoComplete="email" className="h-12" />
                    </div>
                    <div>
                      <Label htmlFor="password" className="flex items-center gap-2 mb-1.5">Password *</Label>
                      <Input id="password" type="password" value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 8 characters" required autoComplete="new-password" className="h-12" />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="business_name" className="flex items-center gap-2 mb-1.5">
                    <Building2 className="h-4 w-4" /> Business Name *
                  </Label>
                  <Input id="business_name" value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Your business or store name" required className="h-12" />
                </div>

                <div>
                  <Label htmlFor="business_type" className="flex items-center gap-2 mb-1.5">
                    <Briefcase className="h-4 w-4" /> Business Type *
                  </Label>
                  <select id="business_type" value={formData.business_type}
                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                    className="w-full h-12 px-3 border border-(--color-border) rounded-xl bg-(--color-surface) text-sm focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary) outline-none"
                  >
                    <option value="sole_trader">Sole Trader</option>
                    <option value="limited_company">Limited Company</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="description" className="mb-1.5">Tell us about your business</Label>
                  <textarea id="description" value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What products do you sell? What makes your business unique?"
                    rows={3}
                    className="w-full px-3 py-3 border border-(--color-border) rounded-xl bg-(--color-surface) text-sm focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary) outline-none resize-none"
                  />
                </div>

                <div>
                  <Label className="mb-2">What will you sell?</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.product_categories.includes(cat)
                            ? 'bg-(--brand-primary) text-white'
                            : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="expected_monthly_sales" className="mb-1.5">Expected Monthly Sales</Label>
                  <select id="expected_monthly_sales" value={formData.expected_monthly_sales}
                    onChange={(e) => setFormData({ ...formData, expected_monthly_sales: e.target.value })}
                    className="w-full h-12 px-3 border border-(--color-border) rounded-xl bg-(--color-surface) text-sm focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary) outline-none"
                  >
                    <option value="">Select range</option>
                    <option value="under_1000">Under £1,000</option>
                    <option value="1000_5000">£1,000 - £5,000</option>
                    <option value="5000_10000">£5,000 - £10,000</option>
                    <option value="10000_50000">£10,000 - £50,000</option>
                    <option value="over_50000">Over £50,000</option>
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-1.5">
                      <Phone className="h-4 w-4" /> Phone
                    </Label>
                    <Input id="phone" type="tel" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+44 7XXX XXXXXX" className="h-12" />
                  </div>
                  <div>
                    <Label htmlFor="website_url" className="flex items-center gap-2 mb-1.5">
                      <Globe className="h-4 w-4" /> Website
                    </Label>
                    <Input id="website_url" type="url" value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://yoursite.com" className="h-12" />
                  </div>
                </div>

                <button type="submit" disabled={loading || !formData.business_name}
                  className="w-full h-12 rounded-xl bg-(--brand-primary) text-white font-bold text-sm shadow-[0_4px_16px_rgba(27,107,58,0.3)] hover:bg-(--brand-primary-hover) active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</> :
                   <><Store className="h-5 w-5" /> Submit Application</>}
                </button>

                <p className="text-xs text-(--color-text-muted) text-center">
                  By submitting, you agree to our seller terms and conditions.
                </p>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      {!showForm && (
        <section className="py-16 lg:py-24 bg-(--brand-dark)">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to grow your business?
            </h2>
            <p className="text-white/50 mb-8 max-w-xl mx-auto text-sm sm:text-base">
              Join hundreds of sellers already thriving on UK Grocery.
              No upfront costs — start free today.
            </p>
            <button
              onClick={handleStartSelling}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-14 px-8 rounded-2xl bg-white text-(--brand-dark) text-base font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Apply Now <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
