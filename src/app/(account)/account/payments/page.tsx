'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  is_default: boolean
}

export default function PaymentsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // In a real implementation, this would fetch from Stripe
    // For now, we'll show a placeholder
    setIsLoading(false)
  }, [])

  const getBrandIcon = (brand: string) => {
    const brandIcons: { [key: string]: string } = {
      visa: '/icons/visa.svg',
      mastercard: '/icons/mastercard.svg',
      amex: '/icons/amex.svg',
    }
    return brandIcons[brand.toLowerCase()] || null
  }

  const getBrandColor = (brand: string) => {
    const colors: { [key: string]: string } = {
      visa: 'bg-blue-50 border-blue-200',
      mastercard: 'bg-orange-50 border-orange-200',
      amex: 'bg-indigo-50 border-indigo-200',
    }
    return colors[brand.toLowerCase()] || 'bg-gray-50 border-gray-200'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            Payment Methods
          </h1>
          <p className="text-gray-500 mt-1">Manage your saved payment methods</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Card
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Payment Methods List */}
      {paymentMethods.length > 0 ? (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={`${getBrandColor(method.brand)} transition-all`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-white rounded flex items-center justify-center shadow-sm">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button variant="outline" size="sm">
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment methods</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Add a payment method to make checkout faster and easier.
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Your payment info is secure</h3>
              <p className="text-sm text-gray-600 mt-1">
                We use industry-standard encryption to protect your payment information. Your card
                details are securely stored by our payment processor, Stripe, and are never stored
                on our servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Cards */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Accepted Payment Methods</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white border rounded-lg">
              <span className="text-sm font-medium text-blue-600">VISA</span>
            </div>
            <div className="px-4 py-2 bg-white border rounded-lg">
              <span className="text-sm font-medium text-orange-600">Mastercard</span>
            </div>
            <div className="px-4 py-2 bg-white border rounded-lg">
              <span className="text-sm font-medium text-indigo-600">AMEX</span>
            </div>
            <div className="px-4 py-2 bg-white border rounded-lg">
              <span className="text-sm font-medium text-purple-600">Apple Pay</span>
            </div>
            <div className="px-4 py-2 bg-white border rounded-lg">
              <span className="text-sm font-medium text-green-600">Google Pay</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
