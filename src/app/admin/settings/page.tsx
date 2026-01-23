'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Store,
  Truck,
  CreditCard,
  Bell,
  Shield,
  Globe,
  Save,
  Loader2,
  Check,
  RefreshCw,
  AlertCircle,
  Plug,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StoreSettings {
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  currency: string
  timezone: string
  min_order_value: number
  free_delivery_threshold: number
  default_delivery_fee: number
  tax_rate: number
  // Features
  enable_reviews: boolean
  enable_wishlist: boolean
  enable_guest_checkout: boolean
  enable_multibuy_offers: boolean
  enable_hero_slides: boolean
  enable_order_tracking: boolean
  enable_stock_display: boolean
  enable_dietary_filters: boolean
  enable_search: boolean
  // Integrations
  enable_unsplash: boolean
  unsplash_access_key: string
  // Notifications
  order_confirmation_email: boolean
  low_stock_alert: boolean
  low_stock_threshold: number
  // Security
  maintenance_mode: boolean
}

const defaultSettings: StoreSettings = {
  store_name: 'FreshMart UK',
  store_email: 'support@freshmart.co.uk',
  store_phone: '+44 20 1234 5678',
  store_address: 'London, United Kingdom',
  currency: 'GBP',
  timezone: 'Europe/London',
  min_order_value: 1500,
  free_delivery_threshold: 5000,
  default_delivery_fee: 399,
  tax_rate: 20,
  // Features
  enable_reviews: true,
  enable_wishlist: true,
  enable_guest_checkout: true,
  enable_multibuy_offers: true,
  enable_hero_slides: true,
  enable_order_tracking: true,
  enable_stock_display: true,
  enable_dietary_filters: true,
  enable_search: true,
  // Integrations
  enable_unsplash: false,
  unsplash_access_key: '',
  // Notifications
  order_confirmation_email: true,
  low_stock_alert: true,
  low_stock_threshold: 10,
  // Security
  maintenance_mode: false,
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('store')
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({
          store_name: data.store_name || defaultSettings.store_name,
          store_email: data.store_email || defaultSettings.store_email,
          store_phone: data.store_phone || defaultSettings.store_phone,
          store_address: data.store_address || defaultSettings.store_address,
          currency: data.currency || defaultSettings.currency,
          timezone: data.timezone || defaultSettings.timezone,
          min_order_value: Number(data.min_order_value) || defaultSettings.min_order_value,
          free_delivery_threshold: Number(data.free_delivery_threshold) || defaultSettings.free_delivery_threshold,
          default_delivery_fee: Number(data.default_delivery_fee) || defaultSettings.default_delivery_fee,
          tax_rate: Number(data.tax_rate) || defaultSettings.tax_rate,
          // Features
          enable_reviews: data.enable_reviews !== false && data.enable_reviews !== 'false',
          enable_wishlist: data.enable_wishlist !== false && data.enable_wishlist !== 'false',
          enable_guest_checkout: data.enable_guest_checkout !== false && data.enable_guest_checkout !== 'false',
          enable_multibuy_offers: data.enable_multibuy_offers !== false && data.enable_multibuy_offers !== 'false',
          enable_hero_slides: data.enable_hero_slides !== false && data.enable_hero_slides !== 'false',
          enable_order_tracking: data.enable_order_tracking !== false && data.enable_order_tracking !== 'false',
          enable_stock_display: data.enable_stock_display !== false && data.enable_stock_display !== 'false',
          enable_dietary_filters: data.enable_dietary_filters !== false && data.enable_dietary_filters !== 'false',
          enable_search: data.enable_search !== false && data.enable_search !== 'false',
          // Integrations
          enable_unsplash: data.enable_unsplash === true || data.enable_unsplash === 'true',
          unsplash_access_key: data.unsplash_access_key || '',
          // Notifications
          order_confirmation_email: data.order_confirmation_email !== false && data.order_confirmation_email !== 'false',
          low_stock_alert: data.low_stock_alert !== false && data.low_stock_alert !== 'false',
          low_stock_threshold: Number(data.low_stock_threshold) || defaultSettings.low_stock_threshold,
          // Security
          maintenance_mode: data.maintenance_mode === true || data.maintenance_mode === 'true',
        })
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError('Failed to load settings. Using default values.')
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setSettings(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setSettings(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
    } else {
      setSettings(prev => ({ ...prev, [name]: value }))
    }
    setSaved(false)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings')
    }
    setSaving(false)
  }

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const sections = [
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'features', label: 'Features', icon: Globe },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-7 w-7 text-emerald-600" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your store configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchSettings}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Unsaved Changes Alert */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">You have unsaved changes. Don't forget to save!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <nav className="p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <section.icon className={`h-5 w-5 ${
                    activeSection === section.id ? 'text-emerald-600' : 'text-gray-400'
                  }`} />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Store Info */}
            {activeSection === 'store' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="h-5 w-5 text-gray-400" />
                    Store Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="store_name">Store Name</Label>
                      <Input
                        id="store_name"
                        name="store_name"
                        value={settings.store_name}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="store_email">Contact Email</Label>
                      <Input
                        id="store_email"
                        name="store_email"
                        type="email"
                        value={settings.store_email}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="store_phone">Contact Phone</Label>
                      <Input
                        id="store_phone"
                        name="store_phone"
                        value={settings.store_phone}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="store_address">Address</Label>
                      <Input
                        id="store_address"
                        name="store_address"
                        value={settings.store_address}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        name="currency"
                        value={settings.currency}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        name="timezone"
                        value={settings.timezone}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      >
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Europe/Paris">Europe/Paris (CET)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery */}
            {activeSection === 'delivery' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-gray-400" />
                    Delivery Settings
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_order_value">Minimum Order Value (pence)</Label>
                      <Input
                        id="min_order_value"
                        name="min_order_value"
                        type="number"
                        value={settings.min_order_value}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Display: {formatPrice(settings.min_order_value)}</p>
                    </div>
                    <div>
                      <Label htmlFor="free_delivery_threshold">Free Delivery Threshold (pence)</Label>
                      <Input
                        id="free_delivery_threshold"
                        name="free_delivery_threshold"
                        type="number"
                        value={settings.free_delivery_threshold}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Display: {formatPrice(settings.free_delivery_threshold)}</p>
                    </div>
                    <div>
                      <Label htmlFor="default_delivery_fee">Default Delivery Fee (pence)</Label>
                      <Input
                        id="default_delivery_fee"
                        name="default_delivery_fee"
                        type="number"
                        value={settings.default_delivery_fee}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Display: {formatPrice(settings.default_delivery_fee)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <h3 className="font-medium text-emerald-900 mb-2">Delivery Slot Management</h3>
                    <p className="text-sm text-emerald-700 mb-3">
                      Manage delivery time slots, pricing, and availability.
                    </p>
                    <a
                      href="/admin/delivery"
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Go to Delivery Slots →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Payments */}
            {activeSection === 'payments' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    Payment Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                      <Input
                        id="tax_rate"
                        name="tax_rate"
                        type="number"
                        value={settings.tax_rate}
                        onChange={handleChange}
                        min={0}
                        max={100}
                        className="mt-1 max-w-xs"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Payment Provider</h3>
                      <p className="text-sm text-gray-600 mb-3">Your store is connected to Stripe for payment processing.</p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-emerald-600 font-medium">Stripe Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gray-400" />
                    Notification Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Order Confirmation Emails</p>
                        <p className="text-sm text-gray-500">Send email to customers when order is placed</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="order_confirmation_email"
                          checked={settings.order_confirmation_email}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Low Stock Alerts</p>
                        <p className="text-sm text-gray-500">Get notified when products are running low</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="low_stock_alert"
                          checked={settings.low_stock_alert}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    {settings.low_stock_alert && (
                      <div className="pl-4">
                        <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                        <Input
                          id="low_stock_threshold"
                          name="low_stock_threshold"
                          type="number"
                          value={settings.low_stock_threshold}
                          onChange={handleChange}
                          className="mt-1 max-w-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            {activeSection === 'features' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gray-400" />
                    Store Features
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">Enable or disable features across your store</p>

                  {/* Core Features */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Core Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Hero Slides</p>
                          <p className="text-sm text-gray-500">Display promotional banners on homepage</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_hero_slides"
                            checked={settings.enable_hero_slides}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Multi-Buy Offers</p>
                          <p className="text-sm text-gray-500">Enable "2 for £X" promotional pricing</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_multibuy_offers"
                            checked={settings.enable_multibuy_offers}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Product Search</p>
                          <p className="text-sm text-gray-500">Enable search functionality across the store</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_search"
                            checked={settings.enable_search}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Customer Features */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Customer Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Guest Checkout</p>
                          <p className="text-sm text-gray-500">Allow customers to checkout without an account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_guest_checkout"
                            checked={settings.enable_guest_checkout}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Order Tracking</p>
                          <p className="text-sm text-gray-500">Allow customers to track their orders</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_order_tracking"
                            checked={settings.enable_order_tracking}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Product Reviews</p>
                          <p className="text-sm text-gray-500">Allow customers to leave reviews on products</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_reviews"
                            checked={settings.enable_reviews}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Wishlist</p>
                          <p className="text-sm text-gray-500">Allow customers to save products to wishlist</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_wishlist"
                            checked={settings.enable_wishlist}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Product Display */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Product Display</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Stock Display</p>
                          <p className="text-sm text-gray-500">Show stock levels and low stock warnings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_stock_display"
                            checked={settings.enable_stock_display}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Dietary Filters</p>
                          <p className="text-sm text-gray-500">Show vegan, organic, gluten-free filters</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="enable_dietary_filters"
                            checked={settings.enable_dietary_filters}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeSection === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Plug className="h-5 w-5 text-gray-400" />
                    Integrations
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">Connect third-party services to enhance your store</p>

                  {/* Unsplash Integration */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Unsplash</p>
                          <p className="text-sm text-gray-500">Free high-quality stock images</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="enable_unsplash"
                          checked={settings.enable_unsplash}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    {settings.enable_unsplash && (
                      <div className="p-4 space-y-4">
                        <div>
                          <Label htmlFor="unsplash_access_key">Access Key</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="unsplash_access_key"
                              name="unsplash_access_key"
                              type="password"
                              value={settings.unsplash_access_key}
                              onChange={handleChange}
                              placeholder="Enter your Unsplash Access Key"
                              className="flex-1"
                            />
                            {settings.unsplash_access_key && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSettings(prev => ({ ...prev, unsplash_access_key: '' }))
                                  setHasChanges(true)
                                  setSaved(false)
                                }}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                              >
                                Delete Key
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Get your free API key from{' '}
                            <a
                              href="https://unsplash.com/developers"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 underline"
                            >
                              unsplash.com/developers
                            </a>
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>How it works:</strong> When enabled, you can search and use free Unsplash images
                            directly when adding product images in the admin panel.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-400" />
                    Security & Maintenance
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-gray-900">Maintenance Mode</p>
                        <p className="text-sm text-red-600">When enabled, customers will see a maintenance page</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="maintenance_mode"
                          checked={settings.maintenance_mode}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Admin Access</h3>
                      <p className="text-sm text-gray-600 mb-3">Manage admin users and permissions in Supabase Dashboard.</p>
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Open Supabase Dashboard →
                      </a>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Hero Slides</h3>
                      <p className="text-sm text-gray-600 mb-3">Manage homepage banner slides and promotions.</p>
                      <a
                        href="/admin/hero-slides"
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Manage Hero Slides →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
