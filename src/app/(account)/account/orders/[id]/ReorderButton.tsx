'use client'

import { useState } from 'react'
import { ShoppingCart, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/hooks/use-cart'
import { toast } from '@/hooks/use-toast'

interface ReorderItem {
  product_id: string
  product_name: string
  product_slug: string
  product_image: string | null
  price_pence: number
  quantity: number
}

export function ReorderButton({ items }: { items: ReorderItem[] }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const handleReorder = () => {
    setLoading(true)

    let added = 0
    for (const item of items) {
      if (!item.product_id) continue
      addItem(
        {
          id: item.product_id,
          name: item.product_name,
          slug: item.product_slug,
          price_pence: item.price_pence,
          image_url: item.product_image,
        },
        item.quantity,
      )
      added++
    }

    setLoading(false)
    setDone(true)
    toast.success(`${added} items added to basket`)
    openCart()
    setTimeout(() => setDone(false), 3000)
  }

  if (items.length === 0) return null

  return (
    <Button
      onClick={handleReorder}
      disabled={loading || done}
      className="w-full bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : done ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      {done ? 'Added to Basket!' : 'Reorder All Items'}
    </Button>
  )
}
