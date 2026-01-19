'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ShoppingBag, CreditCard, MapPin, Calendar, ArrowLeft } from 'lucide-react'
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

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email)
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
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/cart"
        className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to cart
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="p-4 rounded-md bg-red-50 text-red-600">
                {error}
              </div>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Smith"
                      {...register('fullName')}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 7123 456789"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    placeholder="123 High Street"
                    {...register('addressLine1')}
                  />
                  {errors.addressLine1 && (
                    <p className="text-sm text-red-500">{errors.addressLine1.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Flat 4"
                    {...register('addressLine2')}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="London"
                      {...register('city')}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County (Optional)</Label>
                    <Input
                      id="county"
                      placeholder="Greater London"
                      {...register('county')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      placeholder="SW1A 1AA"
                      {...register('postcode')}
                    />
                    {errors.postcode && (
                      <p className="text-sm text-red-500">{errors.postcode.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                  <Input
                    id="deliveryInstructions"
                    placeholder="Leave with neighbour, ring doorbell twice, etc."
                    {...register('deliveryInstructions')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.product.id} className="flex gap-3">
                      <div className="relative h-16 w-16 rounded overflow-hidden bg-gray-100 shrink-0">
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
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPrice(item.product.price_pence * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay {formatPrice(total)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Secure payment powered by Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
