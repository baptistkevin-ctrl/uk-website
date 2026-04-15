'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingCart, Check, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils/cn'

export interface CartableProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  compare_at_price_pence?: number | null
  unit?: string | null
  unit_value?: number | null
  stock_quantity?: number
  vendor_id?: string | null
}

interface AddToCartButtonProps {
  product: CartableProduct
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const { addItem, openCart } = useCart()

  const handleAddToCart = async () => {
    setIsAdding(true)
    addItem(product, quantity)

    setTimeout(() => {
      setIsAdding(false)
      setJustAdded(true)
      setTimeout(() => {
        setJustAdded(false)
        setQuantity(1)
      }, 2000)
    }, 400)

    openCart()
  }

  return (
    <div className="flex items-center gap-3">
      {/* Quantity selector */}
      <div className="flex items-center border border-(--color-border) rounded-xl overflow-hidden bg-(--color-surface)">
        <button
          onClick={() => quantity > 1 && setQuantity(quantity - 1)}
          disabled={quantity <= 1 || isAdding}
          aria-label="Decrease quantity"
          className="flex items-center justify-center h-12 w-12 hover:bg-(--color-elevated) disabled:opacity-40 transition-colors"
        >
          <Minus className="h-4 w-4 text-(--color-text-secondary)" />
        </button>
        <span className="w-10 text-center font-bold text-base text-foreground tabular-nums select-none">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          disabled={isAdding}
          aria-label="Increase quantity"
          className="flex items-center justify-center h-12 w-12 hover:bg-(--color-elevated) disabled:opacity-40 transition-colors"
        >
          <Plus className="h-4 w-4 text-(--color-text-secondary)" />
        </button>
      </div>

      {/* Add to cart button */}
      <button
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold text-white transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          justAdded
            ? 'bg-(--color-success) shadow-[0_4px_16px_rgba(22,163,74,0.3)]'
            : 'bg-(--brand-primary) hover:bg-(--brand-primary-hover) shadow-[0_4px_16px_rgba(27,107,58,0.3)] hover:shadow-[0_8px_24px_rgba(27,107,58,0.4)]'
        )}
      >
        {isAdding ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Adding...
          </>
        ) : justAdded ? (
          <>
            <Check className="h-5 w-5" />
            Added!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </>
        )}
      </button>
    </div>
  )
}
