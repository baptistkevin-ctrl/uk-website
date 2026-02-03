'use client'

import { useState } from 'react'
import Link from 'next/link'

// Custom SVG Icons
const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const CrownIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l3.5 7L12 6l3.5 4L19 3M5 3v11a2 2 0 002 2h10a2 2 0 002-2V3M5 21h14" />
  </svg>
)

const ServerIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
)

const DatabaseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
)

const CodeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
)

const KeyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)

const CloudIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

const SlackIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
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

const QuestionIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const BookIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const technicalCategories = [
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    description: 'Server and hosting management',
    icon: <ServerIcon />,
    color: 'blue',
    articles: [
      'Server configuration',
      'Load balancing setup',
      'CDN management',
      'SSL certificates',
    ]
  },
  {
    id: 'database',
    title: 'Database Management',
    description: 'Supabase and data operations',
    icon: <DatabaseIcon />,
    color: 'emerald',
    articles: [
      'Database migrations',
      'Backup and restore',
      'Query optimization',
      'Data cleanup scripts',
    ]
  },
  {
    id: 'api',
    title: 'API & Integrations',
    description: 'External services and APIs',
    icon: <CodeIcon />,
    color: 'purple',
    articles: [
      'Stripe integration',
      'Payment webhooks',
      'Third-party APIs',
      'API rate limiting',
    ]
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Platform security management',
    icon: <LockIcon />,
    color: 'red',
    articles: [
      'Access control policies',
      'Security audit logs',
      'Vulnerability scanning',
      'Incident response',
    ]
  },
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'User auth and permissions',
    icon: <KeyIcon />,
    color: 'orange',
    articles: [
      'Role management',
      'Permission levels',
      'SSO configuration',
      'Session management',
    ]
  },
  {
    id: 'deployment',
    title: 'Deployment',
    description: 'CI/CD and releases',
    icon: <CloudIcon />,
    color: 'cyan',
    articles: [
      'Deployment pipelines',
      'Environment variables',
      'Rollback procedures',
      'Feature flags',
    ]
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Logs',
    description: 'System monitoring and alerts',
    icon: <ChartIcon />,
    color: 'pink',
    articles: [
      'Error tracking',
      'Performance monitoring',
      'Alert configuration',
      'Log analysis',
    ]
  },
  {
    id: 'super-admin',
    title: 'Super Admin Functions',
    description: 'Advanced admin operations',
    icon: <CrownIcon />,
    color: 'amber',
    articles: [
      'Platform configuration',
      'Commission management',
      'Global settings',
      'System maintenance',
    ]
  },
]

const systemStatus = [
  { name: 'API Gateway', status: 'operational', latency: '45ms' },
  { name: 'Database (Primary)', status: 'operational', latency: '12ms' },
  { name: 'Database (Replica)', status: 'operational', latency: '15ms' },
  { name: 'Stripe Payments', status: 'operational', latency: '120ms' },
  { name: 'Email Service', status: 'operational', latency: '85ms' },
  { name: 'CDN', status: 'operational', latency: '8ms' },
  { name: 'Redis Cache', status: 'operational', latency: '3ms' },
  { name: 'Search Index', status: 'operational', latency: '25ms' },
]

const faqs = [
  {
    question: 'How do I perform a database migration?',
    answer: 'Navigate to Settings > Database in Supabase dashboard. Create a new migration file, test in staging first, then apply to production. Always backup before migrating. Use the CLI command: supabase migration new <name>'
  },
  {
    question: 'How do I add a new admin team member with super admin access?',
    answer: 'Go to Admin > Team and click "Add Team Member". Select "Super Admin" role. Only existing super admins can grant super admin access. The new member will need to complete 2FA setup on first login.'
  },
  {
    question: 'How do I configure platform-wide commission rates?',
    answer: 'Navigate to Admin > Settings > Commission. Here you can set default commission rates by category, minimum/maximum rates, and special rates for top vendors. Changes apply to new orders only.'
  },
  {
    question: 'How do I handle a security incident?',
    answer: 'Follow the incident response protocol: 1) Isolate affected systems, 2) Document the incident in the security log, 3) Contact the security team via priority hotline, 4) Begin investigation, 5) Implement fixes, 6) Post-incident review.'
  },
  {
    question: 'How do I roll back a failed deployment?',
    answer: 'Use Vercel dashboard > Deployments > select the previous working deployment > Click "Promote to Production". For database rollbacks, restore from the latest backup point before the migration.'
  },
  {
    question: 'How do I access raw database queries?',
    answer: 'Use Supabase SQL Editor for direct queries. For production data, always use read replicas for analytics queries. Never run UPDATE/DELETE without WHERE clause. All queries are logged in audit trail.'
  },
]

export default function SuperAdminSupportPortal() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const filteredCategories = searchQuery
    ? technicalCategories.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.articles.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : technicalCategories

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
              <ShieldIcon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Super Admin Portal</h1>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full">
                  ELEVATED ACCESS
                </span>
              </div>
              <p className="text-purple-300">Technical documentation and platform management</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search technical docs, configurations, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-purple-800/50 border border-purple-600 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* System Status - Detailed */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <ServerIcon />
            </div>
            <h2 className="font-semibold text-slate-900">System Health</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
              All Systems Operational
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemStatus.map((system) => (
            <div key={system.name} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">{system.name}</span>
              </div>
              <div className="text-xs text-slate-500">Latency: {system.latency}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="mailto:tech@ukgrocery.com"
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <MailIcon />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Technical Team</h3>
            <p className="text-sm text-slate-500">tech@ukgrocery.com</p>
          </div>
        </a>

        <a
          href="tel:+441234567899"
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 hover:border-red-400 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <PhoneIcon />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Emergency Hotline</h3>
            <p className="text-sm text-slate-500">+44 (0) 123 456 7899</p>
          </div>
        </a>

        <a
          href="#"
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <SlackIcon />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Slack Channel</h3>
            <p className="text-sm text-slate-500">#super-admin-support</p>
          </div>
        </a>
      </div>

      {/* Quick Actions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <a href="#" className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors">
            View Audit Logs
          </a>
          <a href="#" className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors">
            Database Console
          </a>
          <a href="#" className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors">
            Deployment Status
          </a>
          <a href="#" className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors">
            Error Tracking
          </a>
          <a href="#" className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors">
            Feature Flags
          </a>
        </div>
      </div>

      {/* Technical Documentation Categories */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Technical Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                category.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                category.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                category.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                category.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                category.color === 'red' ? 'bg-red-100 text-red-600' :
                category.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                category.color === 'cyan' ? 'bg-cyan-100 text-cyan-600' :
                category.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {category.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{category.title}</h3>
              <p className="text-xs text-slate-500 mb-3">{category.description}</p>
              <ul className="space-y-1.5">
                {category.articles.map((article, idx) => (
                  <li key={idx}>
                    <a
                      href="#"
                      className="text-xs text-slate-600 hover:text-purple-600 flex items-center gap-1.5 group"
                    >
                      <ArrowRightIcon />
                      <span className="group-hover:underline">{article}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
            <QuestionIcon />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Technical FAQs</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4 text-slate-600 text-sm">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Links Section */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Additional Resources</h2>
        <p className="text-purple-300 mb-6">
          Access platform documentation and standard admin guides.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/admin/support"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-xl font-medium hover:bg-purple-50 transition-colors"
          >
            <BookIcon />
            Admin Support Portal
          </Link>
          <Link
            href="/help/admin-guide"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-700 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
          >
            <QuestionIcon />
            Full Admin Guide
          </Link>
        </div>
      </div>
    </div>
  )
}
