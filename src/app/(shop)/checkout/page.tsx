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
  Tag,
  Sparkles,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { formatPrice } from '@/lib/utils/format'
import { createCheckoutSession } from '@/actions/checkout'
import { DeliverySlotPicker } from '@/components/delivery/delivery-slot-picker'
import { CouponInput } from '@/components/checkout/CouponInput'

const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^(\+44|0)\d{9,10}$/, 'Please enter a valid UK phone number'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  county: z.string().optional(),
  postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, 'Please enter a valid UK postcode'),
  deliveryInstructions: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const {
    items,
    itemsWithSavings,
    subtotal,
    subtotalBeforeDiscounts,
    totalSavings,
    hasOffersApplied,
    clearCart
  } = useCart()
  const { user, loading: authLoading } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [showGuestBenefits, setShowGuestBenefits] = useState(true)

  // Delivery slot state
  const [postcodeConfirmed, setPostcodeConfirmed] = useState(false)
  const [deliveryPostcode, setDeliveryPostcode] = useState('')
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<{
    slot_id: string
    delivery_date: string
    start_time: string
    end_time: string
    price_pence: number
    is_express: boolean
  } | null>(null)
  const [deliveryZone, setDeliveryZone] = useState<{
    id: string
    name: string
    base_fee_pence: number
    free_delivery_threshold_pence: number | null
    min_order_pence: number
  } | null>(null)
  const [deliveryReservationId, setDeliveryReservationId] = useState<string | null>(null)

  // Calculate delivery fee based on zone and slot
  const getDeliveryFee = () => {
    if (!deliveryZone) return subtotal >= 5000 ? 0 : 399 // Fallback

    let baseFee = deliveryZone.base_fee_pence
    // Free delivery threshold check
    if (deliveryZone.free_delivery_threshold_pence && subtotal >= deliveryZone.free_delivery_threshold_pence) {
      baseFee = 0
    }

    // Add slot premium for express delivery
    const slotPremium = selectedDeliverySlot?.price_pence || 0
    return baseFee + slotPremium
  }

  const deliveryFee = getDeliveryFee()
  const total = subtotal + deliveryFee

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  })

  const watchedPostcode = watch('postcode')

  // Handler for delivery slot selection
  const handleSlotSelected = (
    slot: typeof selectedDeliverySlot,
    zone: typeof deliveryZone,
    reservationId: string
  ) => {
    setSelectedDeliverySlot(slot)
    setDeliveryZone(zone)
    setDeliveryReservationId(reservationId)
  }

  // Handle postcode confirmation
  const handlePostcodeConfirm = () => {
    if (watchedPostcode && watchedPostcode.length >= 5) {
      setDeliveryPostcode(watchedPostcode.toUpperCase())
      setPostcodeConfirmed(true)
    }
  }

  // Reset delivery slot when postcode changes
  const handlePostcodeChange = () => {
    setPostcodeConfirmed(false)
    setSelectedDeliverySlot(null)
    setDeliveryZone(null)
    setDeliveryReservationId(null)
  }

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

    if (!selectedDeliverySlot) {
      setError('Please select a delivery slot')
      return
    }

    if (deliveryZone?.min_order_pence && subtotal < deliveryZone.min_order_pence) {
      setError(`Minimum order for your area is ${formatPrice(deliveryZone.min_order_pence)}`)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Use itemsWithSavings to pass discounted prices to Stripe
      const result = await createCheckoutSession({
        items: itemsWithSavings.map((item) => ({
          productId: item.product.id,
          name: item.offerApplied ? `${item.product.name} (${item.offerBadge})` : item.product.name,
          price: Math.round(item.discountedPrice / item.quantity), // Unit price after discount
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="h-24 w-24 text-(--color-text-disabled) mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Your cart is empty
          </h1>
          <p className="text-(--color-text-muted) mb-8">
            Add some items to your cart before checkout.
          </p>
          <Link href="/products">
            <Button size="lg">Browse Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-sm text-(--color-text-muted) hover:text-(--brand-primary) mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to cart
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Checkout</h1>
        <p className="text-(--color-text-muted) mb-8">Complete your order securely</p>

        {/* Guest Checkout Banner - Show only for non-logged in users */}
        {!user && !authLoading && showGuestBenefits && (
          <div className="mb-8 relative">
            <div className="bg-(--brand-primary) rounded-2xl p-6 text-white shadow-lg">
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
                    href={`/login?redirectTo=/checkout`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 h-11 bg-(--color-surface) text-(--brand-primary) rounded-xl font-semibold hover:bg-(--color-surface)/90 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link
                    href={`/register?redirectTo=/checkout`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 h-11 bg-(--color-surface)/20 text-white rounded-xl font-semibold hover:bg-(--color-surface)/30 transition-colors"
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
            <div className="bg-(--brand-primary-light) border border-(--brand-primary) rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-(--brand-primary) rounded-full flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
                </p>
                <p className="text-sm text-(--brand-primary)">
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
                <div className="p-4 rounded-xl bg-(--color-error-bg) border border-(--color-error) text-(--color-error)">
                  {error}
                </div>
              )}

              {/* Contact Info */}
              <Card className="shadow-sm border-(--color-border)">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-(--brand-primary)" />
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
                        <p className="text-sm text-(--color-error)">{errors.fullName.message}</p>
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
                        <p className="text-sm text-(--color-error)">{errors.email.message}</p>
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
                      <p className="text-sm text-(--color-error)">{errors.phone.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card className="shadow-sm border-(--color-border)">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-(--color-info)" />
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
                      <p className="text-sm text-(--color-error)">{errors.addressLine1.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2" className="text-sm font-medium">
                      Address Line 2 <span className="text-(--color-text-disabled) font-normal">(Optional)</span>
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
                        <p className="text-sm text-(--color-error)">{errors.city.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="county" className="text-sm font-medium">
                        County <span className="text-(--color-text-disabled) font-normal">(Optional)</span>
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
                        <p className="text-sm text-(--color-error)">{errors.postcode.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryInstructions" className="text-sm font-medium">
                      Delivery Instructions{' '}
                      <span className="text-(--color-text-disabled) font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="deliveryInstructions"
                      placeholder="Leave with neighbour, ring doorbell twice, etc."
                      className="h-11"
                      {...register('deliveryInstructions')}
                    />
                  </div>

                  {/* Postcode confirmation for delivery slots */}
                  {watchedPostcode && watchedPostcode.length >= 5 && !postcodeConfirmed && (
                    <Button
                      type="button"
                      onClick={handlePostcodeConfirm}
                      className="w-full bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
                    >
                      Check Delivery Slots for {watchedPostcode.toUpperCase()}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Slot Selection */}
              {postcodeConfirmed && deliveryPostcode && (
                <Card className="shadow-sm border-(--color-border)">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-8 h-8 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-(--brand-primary)" />
                      </div>
                      Choose Delivery Slot
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DeliverySlotPicker
                      postcode={deliveryPostcode}
                      orderTotalPence={subtotal}
                      onSlotSelected={handleSlotSelected}
                      onPostcodeChange={handlePostcodeChange}
                      selectedSlotId={selectedDeliverySlot?.slot_id}
                    />

                    {/* Selected slot summary */}
                    {selectedDeliverySlot && (
                      <div className="mt-4 p-4 bg-(--brand-primary-light) border border-(--brand-primary) rounded-xl">
                        <div className="flex items-center gap-2 text-(--brand-primary) font-medium mb-1">
                          <Check className="h-4 w-4" />
                          Delivery slot selected
                        </div>
                        <p className="text-sm text-(--brand-primary)">
                          {new Date(selectedDeliverySlot.delivery_date).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}, {selectedDeliverySlot.start_time.slice(0, 5)} - {selectedDeliverySlot.end_time.slice(0, 5)}
                          {selectedDeliverySlot.is_express && ' (Express)'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Security Badge */}
              <div className="flex items-center gap-3 p-4 bg-(--color-elevated) rounded-xl">
                <Shield className="h-5 w-5 text-(--brand-primary)" />
                <p className="text-sm text-(--color-text-secondary)">
                  Your payment information is encrypted and secure. We never store your card
                  details.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24 shadow-lg border-(--color-border)">
                <CardHeader className="bg-(--color-elevated) rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-(--brand-primary)" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Savings Banner */}
                  {hasOffersApplied && totalSavings > 0 && (
                    <div className="bg-(--brand-primary) rounded-xl p-3 flex items-center gap-3 text-white">
                      <div className="w-8 h-8 bg-(--color-surface)/20 rounded-full flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">You're saving {formatPrice(totalSavings)}!</p>
                        <p className="text-xs opacity-90">Multi-buy offers applied</p>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {itemsWithSavings.map((item) => (
                      <li key={item.product.id} className={`flex gap-3 p-2 rounded-lg ${item.offerApplied ? 'bg-(--brand-amber-soft)' : ''}`}>
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-(--color-elevated) shrink-0">
                          {item.product.image_url ? (
                            <Image
                              src={item.product.image_url}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-(--color-text-disabled)">
                              <ShoppingBag className="h-6 w-6" />
                            </div>
                          )}
                          {item.offerApplied && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-(--brand-amber) rounded-full flex items-center justify-center">
                              <Tag className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.product.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-(--color-text-muted)">Qty: {item.quantity}</p>
                            {item.offerBadge && (
                              <Badge className="bg-(--brand-amber) text-white text-[11px] px-1.5 py-0">
                                {item.offerBadge}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {item.offerApplied ? (
                            <>
                              <p className="text-xs text-(--color-text-disabled) line-through">
                                {formatPrice(item.originalPrice)}
                              </p>
                              <p className="text-sm font-semibold text-(--brand-amber)">
                                {formatPrice(item.discountedPrice)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold">
                              {formatPrice(item.originalPrice)}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Separator />

                  <div className="space-y-3">
                    {hasOffersApplied && (
                      <div className="flex justify-between text-sm text-(--color-text-disabled)">
                        <span>Original price</span>
                        <span className="line-through">{formatPrice(subtotalBeforeDiscounts)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-(--color-text-secondary)">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {hasOffersApplied && totalSavings > 0 && (
                      <div className="flex justify-between text-sm text-(--brand-primary) font-medium">
                        <span>Offer savings</span>
                        <span>-{formatPrice(totalSavings)}</span>
                      </div>
                    )}
                    {/* Delivery section with slot info */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-(--color-text-secondary)">
                        <span>Delivery</span>
                        <span>
                          {deliveryFee === 0 ? (
                            <span className="text-(--brand-primary) font-medium">Free</span>
                          ) : (
                            formatPrice(deliveryFee)
                          )}
                        </span>
                      </div>

                      {/* Delivery slot info */}
                      {selectedDeliverySlot && (
                        <div className="text-xs text-(--color-text-muted) bg-(--color-info-bg) p-2 rounded-lg">
                          <div className="flex items-center gap-1 text-(--color-info) font-medium">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedDeliverySlot.delivery_date).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                          <div className="flex items-center gap-1 text-(--color-info)">
                            <Clock className="h-3 w-3" />
                            {selectedDeliverySlot.start_time.slice(0, 5)} - {selectedDeliverySlot.end_time.slice(0, 5)}
                            {selectedDeliverySlot.is_express && (
                              <Badge className="bg-(--brand-amber) text-white text-[11px] px-1 py-0 ml-1">Express</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Free delivery progress */}
                      {deliveryFee > 0 && deliveryZone?.free_delivery_threshold_pence && subtotal < deliveryZone.free_delivery_threshold_pence && (
                        <p className="text-xs text-(--color-text-muted) bg-(--brand-primary-light) p-2 rounded-lg">
                          Add {formatPrice(deliveryZone.free_delivery_threshold_pence - subtotal)} more for free delivery!
                        </p>
                      )}
                      {!deliveryZone && deliveryFee > 0 && subtotal < 5000 && (
                        <p className="text-xs text-(--color-text-muted) bg-(--brand-primary-light) p-2 rounded-lg">
                          Add {formatPrice(5000 - subtotal)} more for free delivery!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div>
                    <CouponInput
                      onApply={(discount) => setCouponDiscount(discount)}
                      subtotal={subtotal}
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-(--brand-primary)">{formatPrice(total - couponDiscount)}</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-(--brand-primary) hover:bg-(--brand-primary-hover) shadow-lg"
                    size="lg"
                    disabled={isProcessing || !selectedDeliverySlot}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay {formatPrice(total - couponDiscount)}
                      </>
                    )}
                  </Button>

                  {!selectedDeliverySlot && (
                    <p className="text-center text-sm text-(--color-warning)">Please select a delivery slot above to continue</p>
                  )}

                  <div className="flex items-center justify-center gap-2 text-xs text-(--color-text-muted)">
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
