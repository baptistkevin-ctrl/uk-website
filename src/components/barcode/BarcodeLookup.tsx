'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────── */

interface Product {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  barcode: string
  brand: string | null
  unit: string | null
  stock_quantity: number
}

interface BarcodeLookupProps {
  barcode: string
  onProductFound?: (product: Product) => void
  onAddToCart?: (product: Product) => void
}

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

/* ─── Component ───────────────────────────────────────────── */

export function BarcodeLookup({
  barcode,
  onProductFound,
  onAddToCart,
}: BarcodeLookupProps) {
  const [status, setStatus] = useState<LookupStatus>('idle')
  const [product, setProduct] = useState<Product | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  /* ── Lookup product by barcode ── */
  const lookupBarcode = useCallback(
    async (code: string) => {
      if (!code.trim()) return

      setStatus('loading')
      setProduct(null)
      setErrorMessage('')

      try {
        const res = await fetch(
          `/api/barcode/lookup?code=${encodeURIComponent(code.trim())}`
        )

        if (res.status === 404) {
          setStatus('not-found')
          return
        }

        if (!res.ok) {
          throw new Error(`Lookup failed: ${res.status}`)
        }

        const data = (await res.json()) as { product: Product }
        setProduct(data.product)
        setStatus('found')
        onProductFound?.(data.product)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred'
        setErrorMessage(message)
        setStatus('error')
      }
    },
    [onProductFound]
  )

  useEffect(() => {
    if (barcode) {
      lookupBarcode(barcode)
    }
  }, [barcode, lookupBarcode])

  /* ── Format price ── */
  function formatPrice(pence: number): string {
    return `\u00A3${(pence / 100).toFixed(2)}`
  }

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div
        className={cn(
          'rounded-xl border border-(--color-border)',
          'bg-(--color-surface) p-6 shadow-(--shadow-sm)',
          'flex items-center justify-center gap-3'
        )}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--brand-primary) border-t-transparent" />
        <span className="text-(--color-text-secondary) text-sm">
          Looking up barcode {barcode}...
        </span>
      </div>
    )
  }

  /* ── Product found ── */
  if (status === 'found' && product) {
    return (
      <div
        className={cn(
          'rounded-xl border border-(--color-border)',
          'bg-(--color-surface) shadow-(--shadow-md) overflow-hidden'
        )}
      >
        <div className="flex gap-4 p-4">
          {/* Product image */}
          <div className="relative h-24 w-24 shrink-0 rounded-lg bg-(--color-elevated) overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-(--color-text-muted)">
                <BarcodeIcon />
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-1 flex-col justify-center gap-1">
            {product.brand && (
              <span className="text-xs font-medium text-(--brand-primary) uppercase tracking-wide">
                {product.brand}
              </span>
            )}
            <h3 className="font-semibold text-(--color-text) leading-tight">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-(--brand-primary)">
                {formatPrice(product.price_pence)}
              </span>
              {product.unit && (
                <span className="text-xs text-(--color-text-muted)">
                  / {product.unit}
                </span>
              )}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                product.stock_quantity > 0
                  ? 'text-emerald-500'
                  : 'text-red-500'
              )}
            >
              {product.stock_quantity > 0
                ? `${product.stock_quantity} in stock`
                : 'Out of stock'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex border-t border-(--color-border)">
          {onAddToCart && product.stock_quantity > 0 && (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center',
                'bg-(--brand-primary) text-white',
                'hover:bg-(--brand-amber) transition-colors cursor-pointer'
              )}
            >
              Add to Cart
            </button>
          )}
          <a
            href={`/products/${product.slug}`}
            className={cn(
              'flex-1 py-3 text-sm font-medium text-center',
              'text-(--color-text) hover:bg-(--color-elevated) transition-colors'
            )}
          >
            View Product
          </a>
        </div>
      </div>
    )
  }

  /* ── Not found ── */
  if (status === 'not-found') {
    return (
      <div
        className={cn(
          'rounded-xl border border-(--color-border)',
          'bg-(--color-surface) p-6 shadow-(--shadow-sm) text-center'
        )}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <SearchOffIcon />
        </div>
        <h3 className="font-semibold text-(--color-text) mb-1">
          Product Not Found
        </h3>
        <p className="text-sm text-(--color-text-muted) mb-4">
          No product matches barcode <span className="font-mono text-(--color-text-secondary)">{barcode}</span>
        </p>
        <a
          href={`/vendor/products/new?barcode=${encodeURIComponent(barcode)}`}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
            'border border-(--brand-primary)/30 text-(--brand-primary)',
            'hover:bg-(--brand-primary)/10 transition-colors'
          )}
        >
          <PlusIcon />
          Use this barcode for a new product
        </a>
      </div>
    )
  }

  /* ── Error ── */
  if (status === 'error') {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/30',
          'bg-red-500/5 p-6 shadow-(--shadow-sm) text-center'
        )}
      >
        <p className="text-sm text-red-400">{errorMessage}</p>
        <button
          type="button"
          onClick={() => lookupBarcode(barcode)}
          className="mt-3 text-sm text-(--brand-primary) hover:underline cursor-pointer"
        >
          Try again
        </button>
      </div>
    )
  }

  return null
}

/* ─── Inline icons ────────────────────────────────────────── */

function BarcodeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" />
      <path d="M5 5v14" /><path d="M15 5v14" /><path d="M19 5v14" />
    </svg>
  )
}

function SearchOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
