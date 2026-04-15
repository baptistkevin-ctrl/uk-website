'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, ShoppingBag, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { hapticLight } from '@/lib/utils/haptics'
import { formatPrice } from '@/lib/utils/format'
import Link from 'next/link'

interface PastProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
}

export function BuyAgainBar() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const [products, setProducts] = useState<PastProduct[]>([])
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return

    const fetchPastProducts = async () => {
      try {
        const res = await fetch('/api/orders?limit=3&status=delivered')
        if (!res.ok) return
        const data = await res.json()

        // Collect unique products from recent orders
        const seen = new Set<string>()
        const items: PastProduct[] = []

        for (const order of data.orders ?? []) {
          for (const item of order.items ?? []) {
            if (!seen.has(item.product_id) && item.product) {
              seen.add(item.product_id)
              items.push({
                id: item.product_id,
                name: item.product.name,
                slug: item.product.slug,
                price_pence: item.product.price_pence ?? item.price_pence,
                image_url: item.product.image_url,
              })
            }
            if (items.length >= 8) break
          }
          if (items.length >= 8) break
        }

        setProducts(items)
      } catch {
        // Silently fail
      }
    }

    fetchPastProducts()
  }, [user])

  if (!user || products.length === 0) return null

  const handleAdd = (product: PastProduct) => {
    hapticLight()
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_pence: product.price_pence,
      image_url: product.image_url,
    } as Parameters<typeof addItem>[0])

    setAddedIds((prev) => new Set(prev).add(product.id))
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 1500)
  }

  return (
    <section className="py-6">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-(--brand-primary)" />
            <h2 className="text-base font-bold text-foreground">Buy Again</h2>
          </div>
          <Link
            href="/smart-reorder"
            className="flex items-center gap-1 text-sm font-medium text-(--brand-primary) hover:underline"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {products.map((product) => {
            const isAdded = addedIds.has(product.id)

            return (
              <div
                key={product.id}
                className="shrink-0 w-28 sm:w-32"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-(--color-elevated) border border-(--color-border) mb-1.5">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-(--color-text-muted)">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}

                  {/* Quick add button */}
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={isAdded ? 'added' : 'add'}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      onClick={() => handleAdd(product)}
                      disabled={isAdded}
                      className={`absolute bottom-1.5 right-1.5 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
                        isAdded
                          ? 'bg-(--color-success) text-white'
                          : 'bg-(--brand-primary) text-white active:scale-90'
                      }`}
                    >
                      {isAdded ? (
                        <motion.svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <path d="M5 13l4 4L19 7" />
                        </motion.svg>
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </motion.button>
                  </AnimatePresence>
                </div>

                <p className="text-xs font-medium text-foreground line-clamp-1 leading-tight">
                  {product.name}
                </p>
                <p className="text-xs font-bold text-(--brand-primary)">
                  {formatPrice(product.price_pence)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
