'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { X, ShoppingBag, Trash2 } from 'lucide-react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { formatPrice } from '@/lib/utils/format'
import { hapticMedium } from '@/lib/utils/haptics'
import type { CartItemWithSavings } from '@/hooks/use-cart'

interface CartItemProps {
  item: CartItemWithSavings
  onRemove: (productId: string) => void
  onUpdateQty: (productId: string, qty: number) => void
}

const SWIPE_THRESHOLD = 100

export function CartItem({ item, onRemove, onUpdateQty }: CartItemProps) {
  const { product, quantity } = item
  const [removing, setRemoving] = useState(false)
  const x = useMotionValue(0)

  // Map drag to reveal background
  const bgOpacity = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1])
  const iconScale = useTransform(x, [-SWIPE_THRESHOLD * 0.5, -SWIPE_THRESHOLD], [0.6, 1])

  const handleDragEnd = useCallback(() => {
    const currentX = x.get()

    if (currentX <= -SWIPE_THRESHOLD) {
      hapticMedium()
      setRemoving(true)
      // Animate off screen then remove
      animate(x, -400, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: () => onRemove(product.id),
      })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }, [x, onRemove, product.id])

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Red delete background — revealed on swipe left */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-lg lg:hidden"
        style={{
          opacity: bgOpacity,
          background: 'var(--color-error)',
        }}
      >
        <motion.div
          className="flex flex-col items-center gap-1 text-white"
          style={{ scale: iconScale }}
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-xs font-semibold">Remove</span>
        </motion.div>
      </motion.div>

      {/* Draggable card */}
      <motion.div
        className="relative z-10 lg:transform-none!"
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -SWIPE_THRESHOLD - 30, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <div className={`relative flex gap-3 rounded-lg bg-(--color-surface) border border-(--color-border) p-3 ${removing ? 'opacity-50' : ''}`}>
          {/* Product image */}
          <div className="relative h-16 w-16 rounded-md overflow-hidden bg-(--color-elevated) shrink-0">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-(--color-text-muted)">
                <ShoppingBag className="h-6 w-6" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {product.name}
            </p>
            <p className="text-xs text-(--color-text-muted)">
              {product.unit ? `${product.unit_value ?? ''}${product.unit}` : formatPrice(product.price_pence) + ' each'}
            </p>

            <div className="flex items-center justify-between mt-2">
              <QuantityStepper
                value={quantity}
                min={1}
                max={product.stock_quantity ?? 99}
                onChange={(qty) => onUpdateQty(product.id, qty)}
              />

              <div className="text-right">
                {item.offerApplied ? (
                  <>
                    <p className="text-xs text-(--color-text-muted) line-through">
                      {formatPrice(item.originalPrice)}
                    </p>
                    <p className="font-mono text-sm font-semibold text-(--brand-amber)">
                      {formatPrice(item.discountedPrice)}
                    </p>
                  </>
                ) : (
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {formatPrice(item.originalPrice)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Remove button — desktop fallback */}
          <button
            type="button"
            onClick={() => onRemove(product.id)}
            aria-label={`Remove ${product.name}`}
            className="absolute -top-1 -right-1 hidden lg:flex h-8 w-8 items-center justify-center rounded-full bg-(--color-surface) border border-(--color-border) text-(--color-text-muted) shadow-sm transition-colors hover:text-(--color-error) hover:bg-(--color-elevated)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
