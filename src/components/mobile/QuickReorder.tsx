'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, X, Check, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { hapticSuccess } from '@/lib/utils/haptics'
import { formatPrice } from '@/lib/utils/format'
import { usePathname } from 'next/navigation'

interface LastOrderItem {
  product_id: string
  product_name: string
  quantity: number
  price_pence: number
}

export function QuickReorder() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [lastOrder, setLastOrder] = useState<LastOrderItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Hide on admin, vendor, checkout, cart pages
  const hidden =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')

  useEffect(() => {
    if (!user || hidden) return

    const fetchLastOrder = async () => {
      try {
        const res = await fetch('/api/orders?limit=1&status=delivered')
        if (!res.ok) return
        const data = await res.json()
        if (data.orders?.[0]?.items?.length > 0) {
          setLastOrder(
            data.orders[0].items.map((item: { product_id: string; product: { name: string }; quantity: number; price_pence: number }) => ({
              product_id: item.product_id,
              product_name: item.product?.name || 'Product',
              quantity: item.quantity,
              price_pence: item.price_pence,
            }))
          )
        }
      } catch {
        // Silently fail — not critical
      }
    }

    fetchLastOrder()
  }, [user, hidden])

  if (hidden || !user || !lastOrder || dismissed) return null

  const totalItems = lastOrder.reduce((sum, item) => sum + item.quantity, 0)
  const totalPence = lastOrder.reduce((sum, item) => sum + item.price_pence * item.quantity, 0)

  const handleReorder = async () => {
    setIsLoading(true)

    try {
      // Fetch full product data for each item
      const res = await fetch('/api/products/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: lastOrder.map((i) => i.product_id) }),
      })

      if (res.ok) {
        const { products } = await res.json()
        for (const product of products) {
          const orderItem = lastOrder.find((i) => i.product_id === product.id)
          if (orderItem) {
            for (let q = 0; q < orderItem.quantity; q++) {
              addItem(product)
            }
          }
        }
      }

      hapticSuccess()
      setIsDone(true)
      setTimeout(() => setDismissed(true), 2500)
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 right-4 z-40 lg:hidden"
        >
          <div className="relative">
            {/* Dismiss button */}
            <button
              onClick={() => setDismissed(true)}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-(--color-surface) border border-(--color-border) shadow-sm flex items-center justify-center text-(--color-text-muted) hover:text-(--color-error) transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Main pill */}
            <button
              onClick={handleReorder}
              disabled={isLoading || isDone}
              className="flex items-center gap-2.5 rounded-full bg-(--brand-primary) text-white pl-3.5 pr-4 py-2.5 shadow-lg shadow-(--brand-primary)/30 hover:shadow-xl active:scale-95 transition-all disabled:opacity-80"
            >
              {isDone ? (
                <>
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-semibold">Added!</span>
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-semibold">Adding...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-5 w-5" />
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">Re-order</p>
                    <p className="text-[11px] text-white/70 leading-tight">
                      {totalItems} items &middot; {formatPrice(totalPence)}
                    </p>
                  </div>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
