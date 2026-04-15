'use client'

import { useState } from 'react'
import Link from 'next/link'

// Custom SVG Icons
const BookIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

const ChatIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const DashboardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
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

const StoreIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const TagIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const HeadphonesIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const helpCategories = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Understanding your admin dashboard',
    icon: <DashboardIcon />,
    color: 'emerald',
    articles: [
      'Key performance indicators',
      'Revenue and sales metrics',
      'System health monitoring',
      'Activity feed overview',
    ]
  },
  {
    id: 'products',
    title: 'Product Management',
    description: 'Manage all products in the marketplace',
    icon: <PackageIcon />,
    color: 'blue',
    articles: [
      'Approving vendor products',
      'Category management',
      'Bulk product actions',
      'Stock alerts configuration',
    ]
  },
  {
    id: 'orders',
    title: 'Order Management',
    description: 'Process and track all orders',
    icon: <CartIcon />,
    color: 'purple',
    articles: [
      'Order status workflow',
      'Processing refunds',
      'Generating invoices',
      'Abandoned cart recovery',
    ]
  },
  {
    id: 'vendors',
    title: 'Vendor Management',
    description: 'Manage vendor accounts and performance',
    icon: <StoreIcon />,
    color: 'orange',
    articles: [
      'Reviewing applications',
      'Commission settings',
      'Vendor performance',
      'Account suspension',
    ]
  },
  {
    id: 'users',
    title: 'User Management',
    description: 'Manage customers and team members',
    icon: <UsersIcon />,
    color: 'pink',
    articles: [
      'User roles and permissions',
      'Team member management',
      'Customer accounts',
      'Admin activity logs',
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing & Promotions',
    description: 'Coupons, offers, and campaigns',
    icon: <TagIcon />,
    color: 'green',
    articles: [
      'Creating coupons',
      'Multi-buy offers',
      'Gift card management',
      'Hero slide configuration',
    ]
  },
  {
    id: 'support',
    title: 'Customer Support',
    description: 'Live chat and support tools',
    icon: <HeadphonesIcon />,
    color: 'cyan',
    articles: [
      'Live chat management',
      'Product Q&A moderation',
      'Chatbot configuration',
      'Support ticket handling',
    ]
  },
  {
    id: 'settings',
    title: 'System Settings',
    description: 'Platform configuration',
    icon: <SettingsIcon />,
    color: 'slate',
    articles: [
      'General settings',
      'Delivery configuration',
      'Email templates',
      'Import/Export data',
    ]
  },
]

const faqs = [
  {
    question: 'How do I approve a new vendor?',
    answer: 'Navigate to Admin > Vendor Applications. Review the applicant\'s business details, documentation, and click "Approve" or "Reject". Approved vendors will receive an email to complete their store setup.'
  },
  {
    question: 'How do I change commission rates?',
    answer: 'Go to Admin > Vendors and select the vendor. In their profile, you can adjust the commission rate. Changes take effect on new orders only - existing orders retain their original rates.'
  },
  {
    question: 'How do I process a refund?',
    answer: 'Navigate to Admin > Orders, find the order, and click "View Details". Click the "Refund" button, specify the amount (full or partial), and confirm. The customer will be notified and refunded via their original payment method.'
  },
  {
    question: 'How do I add a new admin team member?',
    answer: 'Go to Admin > Team and click "Add Team Member". Enter their email and select their role (Admin or Super Admin). They\'ll receive an invitation email to set up their account.'
  },
  {
    question: 'How do I configure delivery zones?',
    answer: 'Navigate to Admin > Delivery. Here you can add delivery zones by postcode areas, set delivery fees for each zone, and configure free delivery thresholds.'
  },
  {
    question: 'How do I export order data?',
    answer: 'Go to Admin > Import/Export. Select "Orders" as the data type, choose your date range and format (CSV or Excel), then click "Export". The file will be downloaded to your device.'
  },
]

const systemStatus = [
  { name: 'API Gateway', status: 'operational' },
  { name: 'Database', status: 'operational' },
  { name: 'Payment Processing', status: 'operational' },
  { name: 'Email Service', status: 'operational' },
  { name: 'CDN / Media', status: 'operational' },
]

export default function AdminSupportPortal() {
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
      <div className="bg-linear-to-r from-(--brand-dark) to-(--brand-dark) rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-(--brand-primary)/20 rounded-xl flex items-center justify-center text-(--brand-primary)">
              <ShieldIcon />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Support Portal</h1>
              <p className="text-(--color-text-disabled)">Technical documentation and platform support</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-(--color-text-disabled)">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search for documentation, guides, and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/50 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">System Status</h2>
          <span className="px-3 py-1 bg-(--brand-primary-light) text-(--brand-primary) text-sm font-medium rounded-full">
            All Systems Operational
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {systemStatus.map((system) => (
            <div key={system.name} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-(--brand-primary) rounded-full"></div>
              <span className="text-sm text-(--color-text-secondary)">{system.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="mailto:admin-support@ukgrocery.com"
          className="flex items-center gap-4 p-5 bg-(--color-surface) rounded-xl border border-(--color-border) hover:border-(--brand-primary)/30 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center text-(--brand-primary) group-hover:bg-(--brand-primary) group-hover:text-white transition-colors">
            <MailIcon />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Technical Support</h3>
            <p className="text-sm text-(--color-text-muted)">admin-support@ukgrocery.com</p>
          </div>
        </a>

        <a
          href="tel:+441234567891"
          className="flex items-center gap-4 p-5 bg-(--color-surface) rounded-xl border border-(--color-border) hover:border-(--color-border) hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-(--color-info-bg) rounded-xl flex items-center justify-center text-(--color-info) group-hover:bg-(--color-info) group-hover:text-white transition-colors">
            <PhoneIcon />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Priority Hotline</h3>
            <p className="text-sm text-(--color-text-muted)">+44 (0) 123 456 7891</p>
          </div>
        </a>

        <a
          href="#"
          className="flex items-center gap-4 p-5 bg-(--color-surface) rounded-xl border border-(--color-border) hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-(--color-info-bg) rounded-xl flex items-center justify-center text-(--color-info) group-hover:bg-(--color-info) group-hover:text-white transition-colors">
            <ChatIcon />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Live Chat</h3>
            <p className="text-sm text-(--color-text-muted)">24/7 Technical Support</p>
          </div>
        </a>
      </div>

      {/* Help Categories */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5 hover:shadow-lg transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                category.color === 'emerald' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                category.color === 'blue' ? 'bg-(--color-info-bg) text-(--color-info)' :
                category.color === 'purple' ? 'bg-(--color-info-bg) text-(--color-info)' :
                category.color === 'orange' ? 'bg-(--color-warning-bg) text-(--brand-amber)' :
                category.color === 'green' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                category.color === 'pink' ? 'bg-(--color-error-bg) text-(--color-error)' :
                category.color === 'cyan' ? 'bg-(--color-info-bg) text-(--color-info)' :
                'bg-(--color-elevated) text-(--color-text-secondary)'
              }`}>
                {category.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
              <p className="text-xs text-(--color-text-muted) mb-3">{category.description}</p>
              <ul className="space-y-1.5">
                {category.articles.map((article, idx) => (
                  <li key={idx}>
                    <Link
                      href={`/help/admin-guide#${category.id}`}
                      className="text-xs text-(--color-text-secondary) hover:text-(--brand-primary) flex items-center gap-1.5 group"
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
                <div className="px-4 pb-4 text-(--color-text-secondary) text-sm">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Full Guide Link */}
      <div className="bg-linear-to-r from-(--brand-primary) to-teal-600 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Complete Admin Documentation</h2>
        <p className="text-white/80 mb-6">
          Access the full admin guide for detailed instructions on managing your marketplace.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/help/admin-guide"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-(--color-surface) text-(--brand-primary) rounded-xl font-medium hover:bg-(--brand-primary-light) transition-colors"
          >
            <BookIcon />
            View Admin Guide
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary) transition-colors"
          >
            <QuestionIcon />
            Help Center
          </Link>
        </div>
      </div>
    </div>
  )
}
