'use client'

import { useState } from 'react'

interface AccountResult {
  email: string
  role: string
  status: 'created' | 'already_exists' | 'error'
  message: string
}

interface SeedResponse {
  success: boolean
  password: string
  accounts: AccountResult[]
}

const PORTALS = [
  { role: 'Customer', email: 'customer@ukgrocery.test', url: '/', loginUrl: '/login', color: 'bg-blue-600' },
  { role: 'Vendor', email: 'vendor@ukgrocery.test', url: '/vendor/dashboard', loginUrl: '/vendor/login', color: 'bg-emerald-600' },
  { role: 'Admin', email: 'admin@ukgrocery.test', url: '/admin', loginUrl: '/login', color: 'bg-purple-600' },
  { role: 'Super Admin', email: 'superadmin@ukgrocery.test', url: '/admin', loginUrl: '/login', color: 'bg-red-600' },
]

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SeedResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const seedAccounts = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/admin/seed-accounts', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to seed accounts')
      }
    } catch {
      setError('Something went wrong. Is the dev server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Setup</h1>
        <p className="text-gray-600 mb-8">Create test accounts and get all portal links in one place.</p>

        {/* Seed Button */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Create Test Accounts</h2>
          <p className="text-gray-500 text-sm mb-4">
            This creates 4 accounts (customer, vendor, admin, super admin) with verified emails so you can log in immediately.
          </p>
          <button
            onClick={seedAccounts}
            disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating Accounts...' : 'Create All Test Accounts'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-2">
              {result.accounts.map((acc) => (
                <div
                  key={acc.email}
                  className={`p-3 rounded-lg text-sm flex items-center justify-between ${
                    acc.status === 'created'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : acc.status === 'already_exists'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <span className="font-medium">{acc.email}</span>
                  <span>
                    {acc.status === 'created' && 'Created'}
                    {acc.status === 'already_exists' && 'Already exists (role updated)'}
                    {acc.status === 'error' && `Error: ${acc.message}`}
                  </span>
                </div>
              ))}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                Password for all accounts: <code className="font-bold bg-amber-100 px-2 py-0.5 rounded">{result.password}</code>
              </div>
            </div>
          )}
        </div>

        {/* All Portals */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Portal Links & Credentials</h2>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Role</th>
                  <th className="text-left p-3 font-medium text-gray-600">Email</th>
                  <th className="text-left p-3 font-medium text-gray-600">Password</th>
                  <th className="text-left p-3 font-medium text-gray-600">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {PORTALS.map((p) => (
                  <tr key={p.role} className="hover:bg-gray-50">
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded ${p.color}`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">{p.email}</td>
                    <td className="p-3 font-mono text-xs">Test1234!</td>
                    <td className="p-3 space-x-2">
                      <a href={p.loginUrl} className="text-emerald-600 hover:underline font-medium">
                        Login
                      </a>
                      <a href={p.url} className="text-blue-600 hover:underline font-medium">
                        Portal
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Site Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3. All Site Links</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-600 rounded-full" /> Customer Pages
              </h3>
              <ul className="space-y-1 text-sm">
                {[
                  ['Home', '/'],
                  ['Products', '/products'],
                  ['Categories', '/categories'],
                  ['Search', '/search'],
                  ['Cart', '/cart'],
                  ['Checkout', '/checkout'],
                  ['Deals', '/deals'],
                  ['Compare', '/compare'],
                  ['Gift Cards', '/gift-cards'],
                  ['Account', '/account'],
                  ['Orders', '/account/orders'],
                  ['Wishlist', '/account/wishlist'],
                  ['Rewards', '/account/rewards'],
                  ['Referrals', '/account/referrals'],
                  ['Support Tickets', '/account/tickets'],
                  ['Login', '/login'],
                  ['Register', '/register'],
                ].map(([label, url]) => (
                  <li key={url}>
                    <a href={url} className="text-blue-600 hover:underline">{label}</a>
                    <span className="text-gray-400 ml-2 font-mono text-xs">{url}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vendor */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-600 rounded-full" /> Vendor Portal
              </h3>
              <ul className="space-y-1 text-sm">
                {[
                  ['Vendor Login', '/vendor/login'],
                  ['Dashboard', '/vendor/dashboard'],
                  ['Products', '/vendor/products'],
                  ['Add Product', '/vendor/products/new'],
                  ['Orders', '/vendor/orders'],
                  ['Analytics', '/vendor/analytics'],
                  ['Payouts', '/vendor/payouts'],
                  ['Settings', '/vendor/settings'],
                  ['Support', '/vendor/support'],
                  ['Tickets', '/vendor/support/ticket'],
                  ['Onboarding', '/vendor/onboarding'],
                ].map(([label, url]) => (
                  <li key={url}>
                    <a href={url} className="text-emerald-600 hover:underline">{label}</a>
                    <span className="text-gray-400 ml-2 font-mono text-xs">{url}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admin */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-600 rounded-full" /> Admin Panel
              </h3>
              <ul className="space-y-1 text-sm">
                {[
                  ['Dashboard', '/admin'],
                  ['Products', '/admin/products'],
                  ['Categories', '/admin/categories'],
                  ['Orders', '/admin/orders'],
                  ['Users', '/admin/users'],
                  ['Vendors', '/admin/vendors'],
                  ['Vendor Applications', '/admin/vendor-applications'],
                  ['Analytics', '/admin/analytics'],
                  ['Coupons', '/admin/coupons'],
                  ['Deals', '/admin/deals'],
                  ['Gift Cards', '/admin/gift-cards'],
                  ['Reviews', '/admin/reviews'],
                  ['Delivery', '/admin/delivery'],
                  ['Stock Alerts', '/admin/stock-alerts'],
                  ['Hero Slides', '/admin/hero-slides'],
                  ['Email Templates', '/admin/email-templates'],
                  ['Audit Logs', '/admin/audit-logs'],
                  ['Team', '/admin/team'],
                  ['Settings', '/admin/settings'],
                  ['Import/Export', '/admin/import-export'],
                  ['Chatbot', '/admin/chatbot'],
                  ['Live Support', '/admin/live-support'],
                  ['Abandoned Carts', '/admin/abandoned-carts'],
                ].map(([label, url]) => (
                  <li key={url}>
                    <a href={url} className="text-purple-600 hover:underline">{label}</a>
                    <span className="text-gray-400 ml-2 font-mono text-xs">{url}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info Pages */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-600 rounded-full" /> Info & Support
              </h3>
              <ul className="space-y-1 text-sm">
                {[
                  ['Help', '/help'],
                  ['FAQ', '/faq'],
                  ['Contact', '/contact'],
                  ['Delivery Info', '/delivery'],
                  ['Returns Policy', '/returns'],
                  ['Sell With Us', '/sell'],
                  ['Privacy Policy', '/privacy'],
                  ['Terms & Conditions', '/terms'],
                  ['Cookie Policy', '/cookies'],
                ].map(([label, url]) => (
                  <li key={url}>
                    <a href={url} className="text-gray-600 hover:underline">{label}</a>
                    <span className="text-gray-400 ml-2 font-mono text-xs">{url}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
