'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  CheckCircle,
  Package,
  Loader2,
  Copy,
  Check,
  Mail,
  Truck,
  Clock,
  ShoppingBag,
  User,
  Search,
  ChevronDown,
  Share2,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const { items, clearCart } = useCart()
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [recommendations, setRecommendations] = useState<{ id: string; name: string; slug: string; image_url: string | null; price_pence: number }[]>([])
  const sessionId = searchParams.get('session_id')

  // Clear cart on successful checkout, but only if there are items and a valid session_id
  useEffect(() => {
    if (items.length > 0 && sessionId) {
      clearCart()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger entrance animation + fetch recommendations
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100)

    async function fetchRecs() {
      try {
        const res = await fetch('/api/products?limit=4&sort=popular')
        if (res.ok) {
          const data = await res.json()
          setRecommendations((data.products || data || []).slice(0, 4))
        }
      } catch { /* ignore */ }
    }
    fetchRecs()

    return () => clearTimeout(timer)
  }, [])

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="mx-auto max-w-lg py-12 sm:py-16">
      {/* Animated success icon */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-(--color-success)/10 transition-transform duration-500"
          style={{
            transform: animate ? 'scale(1)' : 'scale(0)',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <CheckCircle className="h-10 w-10 text-(--color-success)" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-foreground">
          Your order is confirmed!
        </h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">
          We&apos;ll send a confirmation to{' '}
          {user?.email ? (
            <span className="font-medium text-foreground">{user.email}</span>
          ) : (
            'your email'
          )}
        </p>
      </div>

      {/* Order number */}
      {orderNumber && (
        <div className="mb-6 flex items-center justify-center gap-3">
          <span
            className="rounded-md bg-(--color-surface) px-3 py-1.5 font-mono text-sm text-foreground"
          >
            {orderNumber}
          </span>
          <button
            onClick={copyOrderNumber}
            className="rounded-lg p-2 text-(--color-text-muted) transition-colors hover:bg-(--color-surface) hover:text-foreground"
            aria-label="Copy order number"
          >
            {copied ? (
              <Check size={16} className="text-(--color-success)" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      )}

      {/* Estimated delivery */}
      <p className="mb-8 text-center text-sm text-(--color-text-muted)">
        <Truck size={14} className="mr-1 inline-block" />
        Estimated delivery: <span className="font-medium text-foreground">Within 2 hours</span>
      </p>

      {/* Action buttons */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        {user ? (
          <Link href="/account/orders" className="flex-1">
            <Button className="w-full rounded-xl border-2 border-(--color-success) bg-transparent text-(--color-success) hover:bg-(--color-success)/10">
              <Package className="mr-2 h-4 w-4" />
              Track Your Order
            </Button>
          </Link>
        ) : (
          <Link href={`/track-order${orderNumber ? `?order=${orderNumber}` : ''}`} className="flex-1">
            <Button className="w-full rounded-xl border-2 border-(--color-success) bg-transparent text-(--color-success) hover:bg-(--color-success)/10">
              <Search className="mr-2 h-4 w-4" />
              Track Your Order
            </Button>
          </Link>
        )}
        <Link href="/products" className="flex-1">
          <Button className="w-full rounded-xl bg-(--brand-amber) text-white hover:bg-(--brand-amber-hover) transition-(--ease-premium)">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* What happens next timeline */}
      <div className="mb-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="mb-4 font-display text-sm font-semibold text-foreground">
          What happens next?
        </h2>
        <div className="relative space-y-4">
          <div className="absolute bottom-4 left-3.5 top-4 w-px bg-(--color-border)" />
          {[
            { icon: Check, label: 'Order confirmed', desc: 'Your order has been received', active: true },
            { icon: Package, label: 'Preparing your order', desc: 'Picking and packing fresh groceries', active: false },
            { icon: Truck, label: 'Out for delivery', desc: 'On the way to your doorstep', active: false },
            { icon: CheckCircle, label: 'Delivered!', desc: 'Fresh groceries at your door', active: false },
          ].map((step) => (
            <div key={step.label} className="relative flex items-start gap-3">
              <div
                className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  step.active
                    ? 'bg-(--color-success) text-white'
                    : 'border border-(--color-border) bg-background text-(--color-text-muted)'
                }`}
              >
                <step.icon size={14} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-(--color-text-muted)">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guest: create account CTA */}
      {!user && (
        <div className="mb-8 rounded-2xl bg-(--brand-amber)/10 border border-(--brand-amber)/20 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--brand-amber)/20">
              <User size={18} className="text-(--brand-amber)" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Create an account
              </h3>
              <p className="mt-1 text-xs text-(--color-text-muted)">
                Track orders, save addresses, and get exclusive member discounts.
              </p>
              <Link href="/auth/register" className="inline-block mt-3">
                <Button
                  size="sm"
                  className="rounded-lg bg-(--brand-amber) text-white hover:bg-(--brand-amber-hover)"
                >
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible order summary */}
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface)">
        <button
          onClick={() => setShowSummary((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-medium text-foreground">
            Order Summary
          </span>
          <ChevronDown
            size={16}
            className={`text-(--color-text-muted) transition-transform duration-200 ${
              showSummary ? 'rotate-180' : ''
            }`}
          />
        </button>
        {showSummary && (
          <div className="border-t border-(--color-border) px-5 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={14} className="text-(--color-text-muted)" />
                <span className="text-(--color-text-muted)">Confirmation sent to your email</span>
              </div>
              {orderNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Package size={14} className="text-(--color-text-muted)" />
                  <span className="text-(--color-text-muted)">
                    Order: <span className="font-mono text-foreground">{orderNumber}</span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock size={14} className="text-(--color-text-muted)" />
                <span className="text-(--color-text-muted)">Same-day delivery available</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick info cards */}
      <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { icon: Truck, label: 'Fast Delivery', sub: 'Same day available' },
          { icon: Clock, label: 'Live Updates', sub: 'Track your order' },
          { icon: ShoppingBag, label: 'Quality', sub: 'Fresh products' },
        ].map((info) => (
          <div
            key={info.label}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-(--color-surface) p-3 text-center"
          >
            <info.icon size={16} className="text-(--color-text-muted)" />
            <p className="text-xs font-medium text-foreground">{info.label}</p>
            <p className="text-xs text-(--color-text-muted)">{info.sub}</p>
          </div>
        ))}
      </div>

      {/* Recommended Products */}
      {recommendations.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">You Might Also Like</h2>
            <Link href="/products" className="text-sm text-(--brand-primary) hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recommendations.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden hover:shadow-md hover:border-(--brand-primary) transition-all"
              >
                <div className="aspect-square bg-(--color-elevated) relative overflow-hidden">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-(--color-text-disabled)" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-(--brand-primary)">{product.name}</p>
                  <p className="text-sm font-bold text-(--brand-primary) mt-1">£{(product.price_pence / 100).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share Order */}
      {orderNumber && typeof navigator !== 'undefined' && navigator.share && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              navigator.share({
                title: 'UK Grocery Order',
                text: `I just ordered fresh groceries! Order #${orderNumber}`,
                url: window.location.origin,
              }).catch(() => {})
            }}
            className="inline-flex items-center gap-2 text-sm text-(--color-text-muted) hover:text-(--brand-primary) transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share with friends
          </button>
        </div>
      )}
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-(--brand-amber)" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
