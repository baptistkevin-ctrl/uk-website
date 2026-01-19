'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  ShoppingBag,
  CreditCard,
  MapPin,
  ArrowLeft,
  User,
  LogIn,
  Check,
  Shield,
  Clock,
  Gift,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { formatPrice } from '@/lib/utils/format'
import { createCheckoutSession } from '@/actions/checkout'

const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  county: z.string().optional(),
  postcode: z.string().min(5, 'Please enter a valid postcode'),
  deliveryInstructions: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGuestBenefits, setShowGuestBenefits] = useState(true)

  const deliveryFee = subtotal >= 5000 ? 0 : 399
  const total = subtotal + deliveryFee

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  })

  // Pre-fill email and name if user is logged in
  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email)
      if (user.user_metadata?.full_name) {
        setValue('fullName', user.user_metadata.full_name)
      }
    }
  }, [user, setValue])

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      setError('Your cart is empty')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await createCheckoutSession({
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price_pence,
          quantity: item.quantity,
          image: item.product.image_url,
        })),
        customerInfo: {
          email: data.email,
          name: data.fullName,
          phone: data.phone,
        },
        deliveryAddress: {
          line1: data.addressLine1,
          line2: data.addressLine2,
          city: data.city,
          county: data.county,
          postcode: data.postcode,
          instructions: data.deliveryInstructions,
        },
        deliveryFee,
      })

      if (result.error) {
        setError(result.error)
        setIsProcessing(false)
        return
      }

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsProcessing(false)
    }
  }

  // Redirect if cart is empty
  if (!authLoading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-500 mb-8">
            Add some items to your cart before checkout.
          </p>
          <Button size="lg" asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to cart
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-500 mb-8">Complete your order securely</p>

        {/* Guest Checkout Banner - Show only for non-logged in users */}
        {!user && !authLoading && showGuestBenefits && (
          <div className="mb-8 relative">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
              <button
                onClick={() => setShowGuestBenefits(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                &times;
              </button>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5" />
                    <span className="font-semibold">Checking out as Guest</span>
                  </div>
                  <p className="text-white/90 text-sm mb-4 lg:mb-0">
                    Create an account to track orders, save addresses, and get exclusive offers!
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/auth/login?redirect=/checkout`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link
                    href={`/auth/register?redirect=/checkout`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              </div>

              {/* Benefits grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Order History</p>
                    <p className="text-xs text-white/70">Track all your orders</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Saved Addresses</p>
                    <p className="text-xs text-white/70">Faster checkout</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Gift className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Exclusive Offers</p>
                    <p className="text-xs text-white/70">Member discounts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Priority Delivery</p>
                    <p className="text-xs text-white/70">Early time slots</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logged in user banner */}
        {user && !authLoading && (
          <div className="mb-8">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">
                  Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
                </p>
                <p className="text-sm text-emerald-700">
                  You&apos;re signed in. Your order will be saved to your account.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
                  {error}
                </div>
              )}

              {/* Contact Info */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-emerald-600" />
                    </div>
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="John Smith"
                        className="h-11"
                        {...register('fullName')}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-500">{errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-11"
                        {...register('email')}
                        disabled={!!user}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+44 7123 456789"
                      className="h-11"
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1" className="text-sm font-medium">
                      Address Line 1
                    </Label>
                    <Input
                      id="addressLine1"
                      placeholder="123 High Street"
                      className="h-11"
                      {...register('addressLine1')}
                    />
                    {errors.addressLine1 && (
                      <p className="text-sm text-red-500">{errors.addressLine1.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2" className="text-sm font-medium">
                      Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="addressLine2"
                      placeholder="Flat 4"
                      className="h-11"
                      {...register('addressLine2')}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">
                        City
                      </Label>
                      <Input
                        id="city"
                        placeholder="London"
                        className="h-11"
                        {...register('city')}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-500">{errors.city.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="county" className="text-sm font-medium">
                        County <span className="text-gray-400 font-normal">(Optional)</span>
                      </Label>
                      <Input
                        id="county"
                        placeholder="Greater London"
                        className="h-11"
                        {...register('county')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode" className="text-sm font-medium">
                        Postcode
                      </Label>
                      <Input
                        id="postcode"
                        placeholder="SW1A 1AA"
                        className="h-11"
                        {...register('postcode')}
                      />
                      {errors.postcode && (
                        <p className="text-sm text-red-500">{errors.postcode.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryInstructions" className="text-sm font-medium">
                      Delivery Instructions{' '}
                      <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="deliveryInstructions"
                      placeholder="Leave with neighbour, ring doorbell twice, etc."
                      className="h-11"
                      {...register('deliveryInstructions')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Badge */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Shield className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-gray-600">
                  Your payment information is encrypted and secure. We never store your card
                  details.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24 shadow-lg border-slate-200">
                <CardHeader className="bg-slate-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Items */}
                  <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <li key={item.product.id} className="flex gap-3">
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {item.product.image_url ? (
                            <Image
                              src={item.product.image_url}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ShoppingBag className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatPrice(item.product.price_pence * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span>
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-600 font-medium">Free</span>
                        ) : (
                          formatPrice(deliveryFee)
                        )}
                      </span>
                    </div>
                    {deliveryFee > 0 && (
                      <p className="text-xs text-gray-500 bg-emerald-50 p-2 rounded-lg">
                        Add {formatPrice(5000 - subtotal)} more for free delivery!
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatPrice(total)}</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay {formatPrice(total)}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>Secure payment powered by Stripe</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
