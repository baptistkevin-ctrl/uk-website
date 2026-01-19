'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'
import type { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    openCart()
  }

  const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price_pence / product.compare_at_price_pence!) * 100)
    : 0

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingBag className="h-16 w-16" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs">
                -{discountPercentage}%
              </Badge>
            )}
            {product.is_organic && (
              <Badge variant="success" className="text-xs">
                Organic
              </Badge>
            )}
            {product.is_vegan && (
              <Badge variant="info" className="text-xs">
                Vegan
              </Badge>
            )}
          </div>

          {/* Stock warning */}
          {product.track_inventory && product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0 && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="warning" className="text-xs">
                Low Stock
              </Badge>
            </div>
          )}

          {/* Out of stock */}
          {product.track_inventory && product.stock_quantity === 0 && !product.allow_backorder && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">
            {product.name}
          </h3>

          {product.short_description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-1">
              {product.short_description}
            </p>
          )}

          {product.unit && product.unit !== 'each' && (
            <p className="text-xs text-gray-400 mb-2">
              {product.unit_value}{product.unit}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price_pence)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.compare_at_price_pence!)}
                </span>
              )}
            </div>

            <Button
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={handleAddToCart}
              disabled={product.track_inventory && product.stock_quantity === 0 && !product.allow_backorder}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
