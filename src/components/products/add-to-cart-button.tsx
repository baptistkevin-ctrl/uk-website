'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingCart, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'

// Simplified product type for adding to cart
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

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const incrementQuantity = () => {
    setQuantity(quantity + 1)
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      {/* Quantity selector */}
      <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={decrementQuantity}
          disabled={quantity <= 1 || isAdding}
          className="p-4 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-5 w-5 text-gray-600" />
        </button>
        <span className="w-16 text-center font-bold text-lg text-gray-900">
          {quantity}
        </span>
        <button
          onClick={incrementQuantity}
          disabled={isAdding}
          className="p-4 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Add to cart button */}
      <Button
        size="lg"
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        className={`flex-1 h-14 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 ${
          justAdded
            ? 'bg-green-400 hover:bg-green-500 shadow-green-400/25'
            : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 shadow-green-400/25'
        }`}
      >
        {isAdding ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Adding...
          </>
        ) : justAdded ? (
          <>
            <Check className="h-5 w-5 mr-2" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  )
}
