'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CartItem } from '@/components/cart/CartItem'
import { OrderSummary } from '@/components/cart/OrderSummary'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'

export default function CartPage() {
  const { itemsWithSavings, removeItem, updateQuantity, subtotal, itemCount, totalSavings } = useCart()

  const deliveryFee = subtotal >= 4000 ? 0 : 399
  const discount = totalSavings > 0 ? totalSavings : undefined

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
        </div>
      </Container>
    </div>
  )
}
