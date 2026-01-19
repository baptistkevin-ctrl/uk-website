'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/hooks/use-cart'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()

  // Clear cart on successful checkout
  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="mb-6">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Order Confirmed!
      </h1>

      <p className="text-gray-600 mb-8">
        Thank you for your order. We&apos;ve sent a confirmation email with your order details.
      </p>

      <Card className="mb-8 text-left">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-medium">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Order Processing</p>
                <p className="text-sm text-gray-500">
                  We&apos;re preparing your order for delivery
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-medium">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Out for Delivery</p>
                <p className="text-sm text-gray-500">
                  You&apos;ll receive a notification when your order is on its way
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-medium">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Delivered</p>
                <p className="text-sm text-gray-500">
                  Fresh groceries at your doorstep!
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild>
          <Link href="/account/orders">
            View Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Suspense fallback={
        <div className="max-w-lg mx-auto text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
        </div>
      }>
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  )
}
