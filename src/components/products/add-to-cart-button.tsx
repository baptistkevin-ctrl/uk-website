'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import type { Product } from '@/types/database'

interface AddToCartButtonProps {
  product: Product
  disabled?: boolean
}

export function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const { addItem, openCart } = useCart()

  const handleAddToCart = () => {
    addItem(product, quantity)
    openCart()
    setQuantity(1)
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
    <div className="flex items-center gap-4">
      {/* Quantity selector */}
      <div className="flex items-center border rounded-md">
        <button
          onClick={decrementQuantity}
          disabled={quantity <= 1}
          className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-12 text-center font-medium">{quantity}</span>
        <button
          onClick={incrementQuantity}
          className="p-3 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Add to cart button */}
      <Button
        size="lg"
        onClick={handleAddToCart}
        disabled={disabled}
        className="flex-1"
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        Add to Cart
      </Button>
    </div>
  )
}
