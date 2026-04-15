'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/format'

interface OrderSummaryProps {
  subtotal: number
  deliveryFee: number
  discount?: number
  promoCode?: string
  onApplyPromo?: (code: string) => void
  onRemovePromo?: () => void
  showCheckoutButton?: boolean
  showPromoInput?: boolean
}

export function OrderSummary({
  subtotal,
  deliveryFee,
  discount = 0,
  promoCode,
  onApplyPromo,
  onRemovePromo,
  showCheckoutButton = true,
  showPromoInput = true,
}: OrderSummaryProps) {
  const [promoInput, setPromoInput] = useState('')

  const total = subtotal + deliveryFee - discount

  function handleApplyPromo() {
    const trimmed = promoInput.trim()
    if (trimmed && onApplyPromo) {
      onApplyPromo(trimmed)
      setPromoInput('')
    }
  }

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 lg:p-6 lg:sticky lg:top-24">
      <h3 className="text-base font-semibold text-foreground">
        Order Summary
      </h3>

      {/* Line items */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-(--color-text-secondary)">Subtotal</span>
          <span className="text-foreground">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-(--color-text-secondary)">Delivery</span>
          {deliveryFee === 0 ? (
            <span className="font-medium text-(--color-success)">FREE</span>
          ) : (
            <span className="text-foreground">
              {formatPrice(deliveryFee)}
            </span>
          )}
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-sm text-(--color-success)">
            <span className="flex items-center gap-1.5">
              Discount
              {promoCode && (
                <span className="rounded-md bg-(--color-elevated) px-1.5 py-0.5 text-xs font-medium text-(--color-text-secondary)">
                  {promoCode}
                </span>
              )}
            </span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-(--color-border)" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-base font-semibold text-foreground">
            Total
          </span>
          <p className="text-xs text-(--color-text-muted)">(incl. VAT)</p>
        </div>
        <span className="text-base font-semibold text-foreground">
          {formatPrice(total)}
        </span>
      </div>

      {/* Promo code input */}
      {showPromoInput && (
        <div className="mt-4">
          {promoCode ? (
            <div className="flex items-center justify-between rounded-md border border-(--color-success) bg-(--color-elevated) px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-(--color-success)">
                  {promoCode}
                </span>
                <span className="text-(--color-text-muted)">applied</span>
              </div>
              {onRemovePromo && (
                <button
                  type="button"
                  onClick={onRemovePromo}
                  aria-label="Remove promo code"
                  className="text-(--color-text-muted) hover:text-(--color-error) transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                placeholder="Promo code"
                className="flex-1 h-11 rounded-md border border-(--color-border) bg-background px-3 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none transition-colors focus:border-(--brand-primary) focus:ring-1 focus:ring-(--brand-primary)"
              />
              <Button
                type="button"
                variant="secondary"
                className="h-11"
                onClick={handleApplyPromo}
                disabled={!promoInput.trim()}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Checkout button */}
      {showCheckoutButton && (
        <Link href="/checkout" className="block mt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-(--shadow-amber)"
          >
            Proceed to Checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}

      {/* Payment icons */}
      <p className="mt-4 flex flex-wrap gap-2 text-xs text-(--color-text-muted)">
        Visa &middot; Mastercard &middot; PayPal &middot; Apple Pay
      </p>

      {/* Secure badge */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
        <ShieldCheck className="h-4 w-4 text-(--color-success)" />
        Secure checkout
      </div>
    </div>
  )
}
