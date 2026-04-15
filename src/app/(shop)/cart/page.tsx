'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, ArrowRight, ArrowLeft, Truck, Package } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CartItem } from '@/components/cart/CartItem'
import { OrderSummary } from '@/components/cart/OrderSummary'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'

export default function CartPage() {
  const { itemsWithSavings, removeItem, updateQuantity, subtotal, itemCount, totalSavings } = useCart()

  const FREE_DELIVERY_THRESHOLD = 4000
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 399
  const discount = totalSavings > 0 ? totalSavings : undefined
  const amountUntilFree = FREE_DELIVERY_THRESHOLD - subtotal
  const freeDeliveryProgress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)
  const hasFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD

  const [suggestions, setSuggestions] = useState<{ id: string; name: string; slug: string; image_url: string | null; price_pence: number }[]>([])

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch('/api/products?limit=6&sort=popular')
        if (res.ok) {
          const data = await res.json()
          const products = (data.products || data || []).slice(0, 6)
          setSuggestions(products)
        }
      } catch { /* ignore */ }
    }
    fetchSuggestions()
  }, [])

  if (itemsWithSavings.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <Container size="xl">
          <div className="py-6 lg:py-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Your Basket' }]} />

            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-(--color-surface) mb-6">
                <ShoppingBag className="h-16 w-16 text-(--color-text-muted)" />
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground mb-2">
                Your basket is empty
              </h1>
              <p className="text-(--color-text-muted) max-w-sm mb-8">
                Browse our fresh picks and fill it up
              </p>
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-(--brand-amber) hover:bg-(--brand-amber)/90 text-white shadow-(--shadow-amber)"
                >
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <Container size="xl">
        <div className="py-6 lg:py-8">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Your Basket' }]} />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
                Your Basket
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-(--color-text-muted) text-sm">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
                <span className="text-(--color-border)">&middot;</span>
                <Link
                  href="/products"
                  className="text-sm text-(--brand-primary) hover:text-(--brand-amber) transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Free Delivery Progress */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="h-5 w-5 text-(--brand-primary) shrink-0" />
              {hasFreeDelivery ? (
                <p className="text-sm font-semibold text-(--color-success)">You've unlocked free delivery!</p>
              ) : (
                <p className="text-sm text-(--color-text-secondary)">
                  Spend <span className="font-bold text-foreground">{formatPrice(amountUntilFree)}</span> more for <span className="font-semibold text-(--brand-primary)">FREE delivery</span>
                </p>
              )}
            </div>
            <div className="h-2 w-full rounded-full bg-(--color-elevated) overflow-hidden">
              <div
                className="h-full rounded-full bg-(--brand-primary) transition-all duration-500"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:flex-1 space-y-3">
              {itemsWithSavings.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onRemove={(productId) => removeItem(productId)}
                  onUpdateQty={(productId, qty) => updateQuantity(productId, qty)}
                />
              ))}

              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--brand-primary) transition-colors mt-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:w-[380px] lg:shrink-0">
              <div className="lg:sticky lg:top-24">
                <OrderSummary
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  discount={discount}
                  showCheckoutButton
                  showPromoInput
                />
              </div>
            </div>
          </div>

          {/* You Might Also Like */}
          {suggestions.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-foreground mb-4">You Might Also Like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {suggestions.map((product) => (
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
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-(--brand-primary)">{product.name}</p>
                      <p className="text-sm font-bold text-(--brand-primary) mt-1">{formatPrice(product.price_pence)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
