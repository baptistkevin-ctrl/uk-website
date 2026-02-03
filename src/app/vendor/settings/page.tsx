'use client'

import { useEffect, useState } from 'react'
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Camera,
  Globe,
  Building2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VendorSettings {
  id: string
  business_name: string
  slug: string
  description: string
  email: string
  phone: string
  address_line_1: string
  address_line_2: string
  city: string
  postcode: string
  logo_url: string | null
  banner_url: string | null
  company_number: string | null
  vat_number: string | null
  website_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  stripe_onboarding_complete: boolean
  commission_rate: number
}

export default function VendorSettingsPage() {
  const [settings, setSettings] = useState<VendorSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/vendor/register')
      const data = await res.json()
      if (data.vendor) {
        setSettings(data.vendor)
      }
    } catch (error) {
      console.error('Fetch settings error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: settings.business_name,
          description: settings.description,
          email: settings.email,
          phone: settings.phone,
          address_line_1: settings.address_line_1,
          address_line_2: settings.address_line_2,
          city: settings.city,
          postcode: settings.postcode,
          company_number: settings.company_number,
          vat_number: settings.vat_number,
          website_url: settings.website_url,
          facebook_url: settings.facebook_url,
          instagram_url: settings.instagram_url,
          twitter_url: settings.twitter_url,
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof VendorSettings, value: string) => {
    if (settings) {
      setSettings({ ...settings, [field]: value })
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Failed to load settings</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600">Manage your vendor profile and store information</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
            {message.text}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Store className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Store Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={settings.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="slug">Store URL</Label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-gray-500 text-sm">/store/</span>
                <Input
                  id="slug"
                  value={settings.slug}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={settings.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Tell customers about your store..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Online Presence */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Globe className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Online Presence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="website_url">Website URL</Label>
              <div className="mt-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="website_url"
                  type="url"
                  value={settings.website_url || ''}
                  onChange={(e) => updateField('website_url', e.target.value)}
                  className="pl-10"
                  placeholder="https://www.yourstore.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="facebook_url">Facebook</Label>
              <div className="mt-1 relative">
                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="facebook_url"
                  type="url"
                  value={settings.facebook_url || ''}
                  onChange={(e) => updateField('facebook_url', e.target.value)}
                  className="pl-10"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="instagram_url">Instagram</Label>
              <div className="mt-1 relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="instagram_url"
                  type="url"
                  value={settings.instagram_url || ''}
                  onChange={(e) => updateField('instagram_url', e.target.value)}
                  className="pl-10"
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="twitter_url">Twitter / X</Label>
              <div className="mt-1 relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="twitter_url"
                  type="url"
                  value={settings.twitter_url || ''}
                  onChange={(e) => updateField('twitter_url', e.target.value)}
                  className="pl-10"
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Address */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Business Address</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address_line_1">Address Line 1</Label>
              <Input
                id="address_line_1"
                value={settings.address_line_1 || ''}
                onChange={(e) => updateField('address_line_1', e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                value={settings.address_line_2 || ''}
                onChange={(e) => updateField('address_line_2', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={settings.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={settings.postcode || ''}
                onChange={(e) => updateField('postcode', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Business Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_number">Company Number (Optional)</Label>
              <Input
                id="company_number"
                value={settings.company_number || ''}
                onChange={(e) => updateField('company_number', e.target.value)}
                className="mt-1"
                placeholder="e.g., 12345678"
              />
            </div>
            <div>
              <Label htmlFor="vat_number">VAT Number (Optional)</Label>
              <Input
                id="vat_number"
                value={settings.vat_number || ''}
                onChange={(e) => updateField('vat_number', e.target.value)}
                className="mt-1"
                placeholder="e.g., GB123456789"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Payment Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Stripe Connect</p>
                <p className="text-sm text-gray-500">
                  {settings.stripe_onboarding_complete
                    ? 'Your Stripe account is connected and ready to receive payments'
                    : 'Complete Stripe onboarding to receive payments'}
                </p>
              </div>
              {settings.stripe_onboarding_complete ? (
                <span className="flex items-center gap-2 text-emerald-600 font-medium">
                  <CheckCircle className="h-5 w-5" />
                  Connected
                </span>
              ) : (
                <Button
                  type="button"
                  onClick={() => window.location.href = '/vendor/onboarding'}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Complete Setup
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Commission Rate</p>
                <p className="text-sm text-gray-500">Platform commission on each sale</p>
              </div>
              <span className="text-lg font-bold text-gray-900">{settings.commission_rate}%</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
