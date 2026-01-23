'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Phone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'

const benefits = [
  {
    icon: Users,
    title: 'Reach Millions',
    description: 'Access our growing customer base across the UK'
  },
  {
    icon: CreditCard,
    title: 'Easy Payments',
    description: 'Get paid directly via Stripe with automatic payouts'
  },
  {
    icon: Package,
    title: 'Simple Management',
    description: 'Powerful dashboard to manage products and orders'
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    description: 'Analytics and insights to optimize your sales'
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Trusted by thousands of sellers and buyers'
  },
  {
    icon: Store,
    title: 'Your Own Storefront',
    description: 'Customizable store page with your branding'
  }
]

const categories = [
  'Fruits & Vegetables',
  'Meat & Poultry',
  'Fish & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Frozen Foods',
  'Pantry',
  'Drinks',
  'Snacks & Sweets',
  'Health & Beauty',
  'Household',
  'Other'
]

export default function SellPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
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
    phone: ''
  })

  // Check existing status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setChecking(false)
        return
      }

      try {
        const res = await fetch('/api/vendor/register')
        const data = await res.json()
        setExistingStatus(data)
      } catch (error) {
        console.error('Status check error:', error)
      } finally {
        setChecking(false)
      }
    }

    checkStatus()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push('/login?redirect=/sell')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        alert('Application submitted successfully! We will review it shortly.')
        router.push('/account')
      } else {
        alert(data.error || 'Failed to submit application')
      }
    } catch (error) {
      alert('Something went wrong. Please try again.')
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

  // Show loading state
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Already a vendor
  if (existingStatus?.isVendor) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Already a Vendor!</h1>
            <p className="text-gray-600 mb-6">Access your vendor dashboard to manage your store.</p>
            <Link href="/vendor/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Has pending application
  if (existingStatus?.application) {
    const status = existingStatus.application.status
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              status === 'approved' ? 'bg-emerald-100' :
              status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {status === 'approved' ? (
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              ) : status === 'rejected' ? (
                <Shield className="h-8 w-8 text-red-600" />
              ) : (
                <Loader2 className="h-8 w-8 text-yellow-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'approved' ? 'Application Approved!' :
               status === 'rejected' ? 'Application Not Approved' :
               'Application Under Review'}
            </h1>
            <p className="text-gray-600 mb-6">
              {status === 'approved' ? 'Your vendor account is ready. Set up your store now!' :
               status === 'rejected' ? 'Unfortunately your application was not approved. Please contact support for more information.' :
               'We are reviewing your application. You will be notified once it\'s processed.'}
            </p>
            {status === 'approved' && (
              <Link href="/vendor/onboarding">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Complete Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sell on Fresh Groceries
            </h1>
            <p className="text-xl text-emerald-100 mb-8">
              Join thousands of sellers reaching millions of customers.
              Start selling today with our easy-to-use platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => {
                  if (!user) {
                    router.push('/login?redirect=/sell')
                  } else {
                    setShowForm(true)
                  }
                }}
                className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8"
              >
                Start Selling
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="mt-6 text-emerald-200 text-sm">
              Only 15% commission • No monthly fees • Get paid weekly
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Sell With Us?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      {showForm && (
        <section className="py-20 bg-gray-50" id="register">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Seller Application
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Business Name */}
                  <div>
                    <Label htmlFor="business_name" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Business Name *
                    </Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Your business or store name"
                      required
                      className="mt-1"
                    />
                  </div>

                  {/* Business Type */}
                  <div>
                    <Label htmlFor="business_type" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Business Type *
                    </Label>
                    <select
                      id="business_type"
                      value={formData.business_type}
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="sole_trader">Sole Trader</option>
                      <option value="limited_company">Limited Company</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Tell us about your business</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What products do you sell? What makes your business unique?"
                      rows={3}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Product Categories */}
                  <div>
                    <Label>What will you sell? (Select all that apply)</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            formData.product_categories.includes(category)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expected Sales */}
                  <div>
                    <Label htmlFor="expected_monthly_sales">Expected Monthly Sales</Label>
                    <select
                      id="expected_monthly_sales"
                      value={formData.expected_monthly_sales}
                      onChange={(e) => setFormData({ ...formData, expected_monthly_sales: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select range</option>
                      <option value="under_1000">Under £1,000</option>
                      <option value="1000_5000">£1,000 - £5,000</option>
                      <option value="5000_10000">£5,000 - £10,000</option>
                      <option value="10000_50000">£10,000 - £50,000</option>
                      <option value="over_50000">Over £50,000</option>
                    </select>
                  </div>

                  {/* Contact */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+44 7XXX XXXXXX"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website_url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website (optional)
                      </Label>
                      <Input
                        id="website_url"
                        type="url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !formData.business_name}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-gray-500 text-center">
                    By submitting, you agree to our seller terms and conditions.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {!showForm && (
        <section className="py-20 bg-gray-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join our marketplace and start reaching thousands of customers today.
              No upfront costs, just results.
            </p>
            <Button
              size="lg"
              onClick={() => {
                if (!user) {
                  router.push('/login?redirect=/sell')
                } else {
                  setShowForm(true)
                  setTimeout(() => {
                    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8"
            >
              Apply Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
