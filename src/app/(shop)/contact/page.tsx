'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Store,
  ShoppingBag,
  Truck,
  CreditCard,
} from 'lucide-react'

interface FormData {
  name: string
  email: string
  subject: string
  category: string
  orderNumber: string
  message: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    orderNumber: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // In a real application, this would send to an API
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'general', label: 'General Inquiry', icon: <MessageCircle className="w-4 h-4" /> },
    { value: 'order', label: 'Order Issue', icon: <ShoppingBag className="w-4 h-4" /> },
    { value: 'delivery', label: 'Delivery Question', icon: <Truck className="w-4 h-4" /> },
    { value: 'payment', label: 'Payment Problem', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'vendor', label: 'Vendor Inquiry', icon: <Store className="w-4 h-4" /> },
    { value: 'other', label: 'Other', icon: <HelpCircle className="w-4 h-4" /> },
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Message Sent!</h1>
          <p className="text-slate-600 mb-6">
            Thank you for contacting us. We've received your message and will get back to you within 24 hours.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-slate-500 mb-1">Reference Number</p>
            <p className="font-mono font-medium text-slate-900">
              #{Date.now().toString(36).toUpperCase()}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors text-center"
            >
              Back to Home
            </Link>
            <Link
              href="/help"
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-center"
            >
              Browse FAQs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Contact Us</h1>
            <p className="text-emerald-100 max-w-2xl mx-auto">
              Have a question or need assistance? We're here to help. Get in touch and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Contact Cards */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Get in Touch</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Email</h3>
                    <a href="mailto:support@ukgrocerystore.com" className="text-sm text-emerald-600 hover:underline">
                      support@ukgrocerystore.com
                    </a>
                    <p className="text-xs text-slate-500 mt-1">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Phone</h3>
                    <a href="tel:08001234567" className="text-sm text-blue-600 hover:underline">
                      0800 123 4567
                    </a>
                    <p className="text-xs text-slate-500 mt-1">Mon-Fri, 9am-6pm GMT</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Live Chat</h3>
                    <button className="text-sm text-purple-600 hover:underline">
                      Start a conversation
                    </button>
                    <p className="text-xs text-slate-500 mt-1">Available 24/7</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Address</h3>
                    <p className="text-sm text-slate-600">
                      123 Commerce Street<br />
                      London, EC1A 1BB<br />
                      United Kingdom
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Business Hours</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Monday - Friday</span>
                  <span className="font-medium text-slate-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Saturday</span>
                  <span className="font-medium text-slate-900">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Sunday</span>
                  <span className="font-medium text-slate-900">Closed</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  All times are in GMT/BST. Live chat support is available 24/7.
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Quick Links</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-sm text-emerald-600 hover:underline flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Help Center & FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/account/orders" className="text-sm text-emerald-600 hover:underline flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-emerald-600 hover:underline flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Send Us a Message</h2>
              <p className="text-slate-500 mb-6">Fill out the form below and we'll get back to you shortly.</p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <label
                        key={cat.value}
                        className={`flex items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-colors ${
                          formData.category === cat.value
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'border-slate-200 hover:border-emerald-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={cat.value}
                          checked={formData.category === cat.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className={formData.category === cat.value ? 'text-emerald-600' : 'text-slate-400'}>
                          {cat.icon}
                        </span>
                        <span className="text-sm font-medium">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order Number (conditional) */}
                {(formData.category === 'order' || formData.category === 'delivery') && (
                  <div>
                    <label htmlFor="orderNumber" className="block text-sm font-medium text-slate-700 mb-2">
                      Order Number
                    </label>
                    <input
                      type="text"
                      id="orderNumber"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., ORD-12345"
                    />
                    <p className="mt-1 text-xs text-slate-500">Find this in your order confirmation email</p>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Please provide as much detail as possible..."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.message.length}/1000 characters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  By submitting this form, you agree to our{' '}
                  <Link href="/privacy" className="text-emerald-600 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
