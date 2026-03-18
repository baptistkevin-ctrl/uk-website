'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle,
  Package,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Mail,
  MapPin,
  Truck,
  Clock,
  ShoppingBag,
  User,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const { items, clearCart } = useCart()
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const sessionId = searchParams.get('session_id')

  // Clear cart on successful checkout, but only if there are items and a valid session_id
  // This prevents clearing the cart when revisiting from browser history
  useEffect(() => {
    if (items.length > 0 && sessionId) {
      clearCart()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-yellow-900 text-sm">!</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Order Confirmed!
        </h1>
        <p className="text-gray-500 text-lg">
          Thank you for your order. We&apos;ve sent a confirmation email with your order details.
        </p>
      </div>

      {/* Order Number Card */}
      {orderNumber && (
        <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-emerald-600 font-medium mb-1">Order Number</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-900 tracking-wide">
                  {orderNumber}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                onClick={copyOrderNumber}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Number
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What happens next */}
      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-emerald-200" />

            <ul className="space-y-6">
              <li className="flex gap-4 relative">
                <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold z-10">
                  1
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-900">Order Confirmed</p>
                  <p className="text-sm text-gray-500">
                    Your order has been received and is being processed
                  </p>
                </div>
              </li>
              <li className="flex gap-4 relative">
                <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold z-10">
                  2
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-900">Preparing Your Order</p>
                  <p className="text-sm text-gray-500">
                    Our team is carefully picking and packing your fresh groceries
                  </p>
                </div>
              </li>
              <li className="flex gap-4 relative">
                <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold z-10">
                  3
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-900">Out for Delivery</p>
                  <p className="text-sm text-gray-500">
                    You&apos;ll receive a notification when your order is on its way
                  </p>
                </div>
              </li>
              <li className="flex gap-4 relative">
                <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold z-10">
                  4
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-900">Delivered!</p>
                  <p className="text-sm text-gray-500">
                    Fresh groceries at your doorstep. Enjoy!
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Actions based on user type */}
      {user ? (
        // Logged in user actions
        <Card className="mb-6 shadow-sm border-blue-100 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Track Your Order</h3>
                <p className="text-sm text-gray-600 mb-4">
                  View your order status and history in your account dashboard.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/account/orders">
                      <Package className="mr-2 h-4 w-4" />
                      View My Orders
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Guest user actions
        <Card className="mb-6 shadow-sm border-amber-100 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Check Your Email</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We&apos;ve sent order confirmation and tracking details to your email address.
                  Save your order number to track your delivery.
                </p>
                <Separator className="my-4" />
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Track your order</p>
                    <p className="text-xs text-gray-500 mb-3">
                      Use your order number and email to track your delivery status
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/track-order${orderNumber ? `?order=${orderNumber}` : ''}`}>
                        Track Order Status
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create account prompt for guests */}
      {!user && (
        <Card className="mb-6 shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Create an Account</h3>
                <p className="text-sm text-white/90 mb-4">
                  Track all your orders, save addresses for faster checkout, and get exclusive
                  member discounts!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    className="bg-white text-emerald-600 hover:bg-emerald-50"
                  >
                    <Link href="/auth/register">Create Free Account</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <Truck className="h-5 w-5 text-slate-600" />
          <div>
            <p className="font-medium text-sm text-slate-900">Fast Delivery</p>
            <p className="text-xs text-slate-500">Same day available</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <Clock className="h-5 w-5 text-slate-600" />
          <div>
            <p className="font-medium text-sm text-slate-900">Real-time Updates</p>
            <p className="text-xs text-slate-500">Track your order</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <ShoppingBag className="h-5 w-5 text-slate-600" />
          <div>
            <p className="font-medium text-sm text-slate-900">Quality Guaranteed</p>
            <p className="text-xs text-slate-500">Fresh products</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <Suspense
          fallback={
            <div className="max-w-2xl mx-auto text-center">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
              <p className="mt-4 text-gray-500">Processing your order...</p>
            </div>
          }
        >
          <CheckoutSuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
