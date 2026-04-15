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
      visa: 'bg-(--color-info-bg) border-(--color-border)',
      mastercard: 'bg-(--color-warning-bg) border-(--color-border)',
      amex: 'bg-(--color-info-bg) border-(--color-border)',
    }
    return colors[brand.toLowerCase()] || 'bg-background border-(--color-border)'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-(--brand-primary)" />
            Payment Methods
          </h1>
          <p className="text-(--color-text-muted) mt-1">Manage your saved payment methods</p>
        </div>
        <Button className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add New Card
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-(--color-error-bg) border border-(--color-error-border) rounded-lg text-(--color-error)">
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
                    <div className="w-12 h-8 bg-(--color-surface) rounded flex items-center justify-center shadow-sm">
                      <CreditCard className="h-6 w-6 text-(--color-text-muted)" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-(--brand-primary-light) text-(--brand-primary) text-xs font-medium rounded-full">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-(--color-text-muted)">
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
                      className="text-(--color-error) border-(--color-error-border) hover:bg-(--color-error-bg)"
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
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-(--color-text-muted)" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No payment methods</h3>
              <p className="text-(--color-text-muted) mb-6 max-w-sm mx-auto">
                Add a payment method to make checkout faster and easier.
              </p>
              <Button className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Card className="bg-background border-(--color-border)">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-(--color-border) rounded-full flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-(--color-text-secondary)" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Your payment info is secure</h3>
              <p className="text-sm text-(--color-text-secondary) mt-1">
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
            <div className="px-4 py-2.5 bg-(--color-surface) border border-(--color-border) rounded-lg">
              <span className="text-sm font-medium text-(--color-info)">VISA</span>
            </div>
            <div className="px-4 py-2.5 bg-(--color-surface) border border-(--color-border) rounded-lg">
              <span className="text-sm font-medium text-(--brand-amber)">Mastercard</span>
            </div>
            <div className="px-4 py-2.5 bg-(--color-surface) border border-(--color-border) rounded-lg">
              <span className="text-sm font-medium text-(--color-info)">AMEX</span>
            </div>
            <div className="px-4 py-2.5 bg-(--color-surface) border border-(--color-border) rounded-lg">
              <span className="text-sm font-medium text-(--color-info)">Apple Pay</span>
            </div>
            <div className="px-4 py-2.5 bg-(--color-surface) border border-(--color-border) rounded-lg">
              <span className="text-sm font-medium text-(--brand-primary)">Google Pay</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
