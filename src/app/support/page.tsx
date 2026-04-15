'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  FileQuestion,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  Clock,
  MapPin,
  Send,
  CheckCircle
} from 'lucide-react'

const supportCategories = [
  {
    icon: Package,
    title: 'Orders & Delivery',
    description: 'Track orders, delivery issues, missing items',
    link: '/track-order'
  },
  {
    icon: RotateCcw,
    title: 'Returns & Refunds',
    description: 'Return products, request refunds',
    link: '/returns'
  },
  {
    icon: CreditCard,
    title: 'Payments & Billing',
    description: 'Payment issues, invoices, gift cards',
    link: '/account/payments'
  },
  {
    icon: FileQuestion,
    title: 'FAQs',
    description: 'Find answers to common questions',
    link: '/faq'
  }
]

const contactMethods = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with our support team',
    availability: 'Available 24/7',
    action: 'Start Chat',
    primary: true
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'support@ukgrocerystore.com',
    availability: 'Response within 24 hours',
    action: 'Send Email',
    href: 'mailto:support@ukgrocerystore.com'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: '0800 123 4567',
    availability: 'Mon-Sat: 8am-8pm',
    action: 'Call Now',
    href: 'tel:08001234567'
  }
]

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    category: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would submit to an API
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-(--brand-primary) text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-(--color-surface)/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Headphones className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Our customer support team is here to assist you with any questions or concerns.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Help Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Help</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportCategories.map((category) => (
              <Link
                key={category.title}
                href={category.link}
                className="bg-(--color-surface) rounded-xl p-6 border border-(--color-border) hover:border-(--brand-primary) hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center mb-4 group-hover:bg-(--brand-primary-light) transition-colors">
                  <category.icon className="h-6 w-6 text-(--brand-primary)" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
                <p className="text-sm text-(--color-text-muted)">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Contact Methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method) => (
              <div
                key={method.title}
                className={`bg-(--color-surface) rounded-xl p-6 border ${
                  method.primary ? 'border-(--brand-primary) ring-1 ring-(--brand-primary-light)' : 'border-(--color-border)'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  method.primary ? 'bg-(--brand-primary)' : 'bg-background'
                }`}>
                  <method.icon className={`h-6 w-6 ${method.primary ? 'text-white' : 'text-(--color-text-secondary)'}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
                <p className="text-(--color-text-secondary) mb-1">{method.description}</p>
                <div className="flex items-center gap-1 text-sm text-(--color-text-muted) mb-4">
                  <Clock className="h-4 w-4" />
                  {method.availability}
                </div>
                {method.href ? (
                  <a
                    href={method.href}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      method.primary
                        ? 'bg-(--brand-primary) text-white hover:bg-(--brand-primary-hover)'
                        : 'bg-background text-foreground hover:bg-(--color-elevated)'
                    }`}
                  >
                    {method.action}
                  </a>
                ) : (
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
                  >
                    {method.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="max-w-2xl mx-auto">
          <div className="bg-(--color-surface) rounded-2xl shadow-sm border border-(--color-border) p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Submit a Request</h2>
            <p className="text-(--color-text-muted) mb-6">Fill out the form below and we'll get back to you as soon as possible.</p>

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-(--brand-primary)" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Request Submitted!</h3>
                <p className="text-(--color-text-muted) mb-6">
                  We've received your message and will respond within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({ name: '', email: '', orderNumber: '', category: '', message: '' })
                  }}
                  className="text-(--brand-primary) font-medium hover:text-(--brand-primary-hover)"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) outline-none transition-colors"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) outline-none transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Order Number (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) outline-none transition-colors"
                      placeholder="ORD-123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) outline-none transition-colors"
                    >
                      <option value="">Select a category</option>
                      <option value="order">Order Issue</option>
                      <option value="delivery">Delivery Problem</option>
                      <option value="refund">Refund Request</option>
                      <option value="product">Product Question</option>
                      <option value="account">Account Help</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    How can we help? *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-(--color-border) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) outline-none transition-colors resize-none"
                    placeholder="Please describe your issue in detail..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-(--brand-primary) text-white rounded-lg font-semibold hover:bg-(--brand-primary-hover) transition-colors"
                >
                  <Send className="h-5 w-5" />
                  Submit Request
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Store Info */}
        <section className="mt-12 bg-(--color-surface) rounded-2xl border border-(--color-border) p-4 sm:p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Visit Our Store</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-(--brand-primary)" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Address</h3>
              <p className="text-(--color-text-muted)">123 Fresh Street<br />London, UK EC1A 1BB</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-(--brand-primary)" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Opening Hours</h3>
              <p className="text-(--color-text-muted)">Mon-Sat: 7am - 10pm<br />Sunday: 8am - 8pm</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center mx-auto mb-4">
                <Truck className="h-6 w-6 text-(--brand-primary)" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Delivery</h3>
              <p className="text-(--color-text-muted)">Free delivery on orders<br />over £50</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
