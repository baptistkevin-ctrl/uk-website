'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight, Truck } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'
import { CartItem } from './CartItem'

const FREE_DELIVERY_THRESHOLD = 5000 // £50 — matches checkout

export function MiniCart() {
  const {
    itemsWithSavings,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    totalSavings,
    hasOffersApplied,
    itemCount,
  } = useCart()

  const amountUntilFree = FREE_DELIVERY_THRESHOLD - subtotal
  const freeDeliveryProgress = Math.min(
    (subtotal / FREE_DELIVERY_THRESHOLD) * 100,
    100
  )
  const hasFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD
  const isEmpty = itemsWithSavings.length === 0

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 z-999!" side="right">
        {/* Header */}
        <SheetHeader className="p-5 border-b border-(--color-border) bg-(--color-surface)">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--brand-primary) text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">
                Your Basket
              </span>
              <p className="text-sm font-normal text-(--color-text-secondary)">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Your shopping basket contents
          </SheetDescription>
        </SheetHeader>

        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-(--color-text-muted) mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Your basket is empty
            </h3>
            <p className="text-sm text-(--color-text-muted) mb-6">
              Browse our shop and add items to get started
            </p>
            <Link href="/products" onClick={closeCart}>
              <Button variant="primary">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {itemsWithSavings.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onRemove={removeItem}
                  onUpdateQty={updateQuantity}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-(--color-border) p-5 space-y-3">
              {/* Free delivery progress */}
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-(--brand-primary)" />
                {hasFreeDelivery ? (
                  <p className="text-sm font-medium text-(--color-success)">
                    Free delivery!
                  </p>
                ) : (
                  <p className="text-sm text-(--color-text-secondary)">
                    <span className="font-medium text-foreground">
                      {formatPrice(amountUntilFree)}
                    </span>{' '}
                    away from free delivery
                  </p>
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-(--color-elevated) overflow-hidden">
                <div
                  className="h-full rounded-full bg-(--brand-primary) transition-all duration-300"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-(--color-text-secondary)">Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Savings */}
              {hasOffersApplied && totalSavings > 0 && (
                <div className="flex items-center justify-between text-sm text-(--color-success)">
                  <span>You save</span>
                  <span className="font-semibold">-{formatPrice(totalSavings)}</span>
                </div>
              )}

              {/* Action buttons */}
              <Link href="/cart" onClick={closeCart} className="block w-full">
                <Button variant="ghost" className="w-full h-11">
                  View Basket
                </Button>
              </Link>

              <Link href="/checkout" onClick={closeCart} className="block w-full">
                <Button variant="primary" size="lg" className="w-full h-12">
                  Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
