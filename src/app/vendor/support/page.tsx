'use client'

import { useState } from 'react'
import Link from 'next/link'

// Custom SVG Icons
const BookIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const MessageIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const MailIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const QuestionIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TicketIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
)

const PackageIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const CartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const CreditCardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const TruckIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Set up your store and start selling',
    icon: <BookIcon />,
    color: 'emerald',
    articles: [
      'Setting up your vendor account',
      'Understanding your dashboard',
      'Store profile best practices',
      'Connecting Stripe payments',
    ]
  },
  {
    id: 'products',
    title: 'Product Management',
    description: 'Add and manage your products',
    icon: <PackageIcon />,
    color: 'blue',
    articles: [
      'Adding your first product',
      'Product photography tips',
      'Writing product descriptions',
      'Managing inventory',
    ]
  },
  {
    id: 'orders',
    title: 'Orders & Fulfillment',
    description: 'Process and ship customer orders',
    icon: <CartIcon />,
    color: 'purple',
    articles: [
      'Order workflow explained',
      'Printing invoices',
      'Handling refunds',
      'Order notifications',
    ]
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    description: 'Configure shipping options',
    icon: <TruckIcon />,
    color: 'orange',
    articles: [
      'Setting shipping rates',
      'Delivery zones',
      'Packaging guidelines',
      'Tracking shipments',
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Payouts',
    description: 'Understand fees and payouts',
    icon: <CreditCardIcon />,
    color: 'green',
    articles: [
      'Commission structure',
      'Payout schedule',
      'Tax information',
      'Payment disputes',
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Growth',
    description: 'Grow your sales with insights',
    icon: <ChartIcon />,
    color: 'pink',
    articles: [
      'Understanding analytics',
      'Optimising listings',
      'Customer reviews',
      'Marketing tips',
    ]
  },
]

const faqs = [
  {
    question: 'How do I get paid?',
    answer: 'Payments are processed weekly via Stripe. Funds are automatically transferred to your connected bank account, minus our commission. The minimum payout threshold is £10.'
  },
  {
    question: 'What is the commission rate?',
    answer: 'Our commission rates range from 10-15% depending on the product category. This includes payment processing fees. There are no monthly fees - you only pay when you make sales.'
  },
  {
    question: 'How do I handle returns?',
    answer: 'When a customer requests a return, you\'ll receive a notification. Review the request in your orders dashboard, communicate with the customer, and process the refund if appropriate. The refund amount will be deducted from your next payout.'
  },
  {
    question: 'Can I offer free shipping?',
    answer: 'Yes! You can configure free shipping thresholds in your shipping settings. Many vendors offer free shipping on orders over a certain amount to encourage larger purchases.'
  },
  {
    question: 'How do I contact a customer?',
    answer: 'You can contact customers through the order details page. Click on any order to view customer contact information and send messages regarding their order.'
  },
  {
    question: 'What happens if a product goes out of stock?',
    answer: 'Products automatically become unavailable when stock reaches zero. You\'ll receive low stock alerts based on your configured thresholds. Make sure to update your inventory regularly.'
  },
]

export default function VendorSupportPortal() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const filteredCategories = searchQuery
    ? helpCategories.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.articles.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : helpCategories

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-linear-to-r from-(--brand-primary) to-teal-600 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Vendor Support Portal</h1>
          <p className="text-white/80 mb-6">
            Find answers, get help, and learn how to grow your business on our platform.
          </p>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-(--color-text-disabled)">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search for help articles, FAQs, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-(--color-surface)/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Quick Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="mailto:vendor-support@ukgrocery.com"
          className="flex items-center gap-4 p-5 bg-(--color-surface) rounded-xl border border-(--color-border) hover:border-(--brand-primary)/30 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center text-(--brand-primary) group-hover:bg-(--brand-primary) group-hover:text-white transition-colors">
            <MailIcon />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Email Support</h3>
            <p className="text-sm text-(--color-text-muted)">vendor-support@ukgrocery.com</p>
          </div>
        </a>

        <a
          href="tel:+441onal2345678"
          className="flex items-center gap-4 p-5 bg-(--color-surface) rounded-xl border border-(--color-border) hover:border-(--color-border) hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-(--color-info-bg) rounded-xl flex items-center justify-center text-(--color-info) group-hover:bg-(--color-info) group-hover:text-white transition-colors">
            <PhoneIcon />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Phone Support</h3>
            <p className="text-sm text-(--color-text-muted)">+44 (0) 123 456 7890</p>
          </div>
        </a>

        <Link
          href="/vendor/support/ticket"
          className="flex items-center gap-4 p-5 bg-(--color-surface) rounded-xl border border-(--color-border) hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-(--color-info-bg) rounded-xl flex items-center justify-center text-(--color-info) group-hover:bg-(--color-info) group-hover:text-white transition-colors">
            <TicketIcon />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Submit a Ticket</h3>
            <p className="text-sm text-(--color-text-muted)">Get help within 24 hours</p>
          </div>
        </Link>
      </div>

      {/* Support Hours */}
      <div className="bg-(--brand-amber-soft) border border-(--color-border) rounded-xl p-4 flex items-center gap-3">
        <div className="text-(--brand-amber)">
          <ClockIcon />
        </div>
        <div>
          <span className="font-medium text-amber-900">Support Hours:</span>
          <span className="text-(--brand-amber) ml-2">Monday - Friday, 9:00 AM - 6:00 PM GMT</span>
        </div>
      </div>

      {/* Help Categories */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Browse Help Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                category.color === 'emerald' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                category.color === 'blue' ? 'bg-(--color-info-bg) text-(--color-info)' :
                category.color === 'purple' ? 'bg-(--color-info-bg) text-(--color-info)' :
                category.color === 'orange' ? 'bg-(--color-warning-bg) text-(--brand-amber)' :
                category.color === 'green' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                'bg-(--color-error-bg) text-(--color-error)'
              }`}>
                {category.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
              <p className="text-sm text-(--color-text-muted) mb-4">{category.description}</p>
              <ul className="space-y-2">
                {category.articles.map((article, idx) => (
                  <li key={idx}>
                    <Link
                      href={`/help/vendor-guide#${category.id}`}
                      className="text-sm text-(--color-text-secondary) hover:text-(--brand-primary) flex items-center gap-2 group"
                    >
                      <ArrowRightIcon />
                      <span className="group-hover:underline">{article}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-(--color-elevated) rounded-lg flex items-center justify-center text-(--color-text-secondary)">
            <QuestionIcon />
          </div>
          <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-(--color-border) rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-background transition-colors"
              >
                <span className="font-medium text-foreground">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-(--color-text-disabled) transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4 text-(--color-text-secondary)">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Full Guide Link */}
      <div className="bg-linear-to-r from-(--brand-dark) to-(--brand-dark) rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Need More Help?</h2>
        <p className="text-(--color-text-disabled) mb-6">
          Check out our comprehensive seller guide for detailed tutorials and best practices.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/help/vendor-guide"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary) transition-colors"
          >
            <BookIcon />
            View Full Seller Guide
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/15 transition-colors"
          >
            <QuestionIcon />
            Help Center
          </Link>
        </div>
      </div>
    </div>
  )
}
