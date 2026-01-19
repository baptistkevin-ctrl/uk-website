import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft, Leaf, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AddToCartButton } from '@/components/products/add-to-cart-button'
import type { Metadata } from 'next'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.short_description || product.description,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !product) {
    notFound()
  }

  const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price_pence / product.compare_at_price_pence!) * 100)
    : 0

  const isOutOfStock = product.track_inventory && product.stock_quantity === 0 && !product.allow_backorder
  const isLowStock = product.track_inventory && product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-green-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to products
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingBag className="h-24 w-24" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {hasDiscount && (
              <Badge variant="destructive">
                Save {discountPercentage}%
              </Badge>
            )}
            {product.is_organic && (
              <Badge variant="success">
                <Leaf className="h-3 w-3 mr-1" />
                Organic
              </Badge>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>

          {product.brand && (
            <p className="text-gray-500 mb-4">by {product.brand}</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price_pence)}
            </span>
            {hasDiscount && (
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(product.compare_at_price_pence!)}
              </span>
            )}
          </div>

          {/* Unit info */}
          {product.unit && product.unit !== 'each' && (
            <p className="text-gray-500 mb-4">
              {product.unit_value} {product.unit}
            </p>
          )}

          {/* Stock status */}
          {isOutOfStock && (
            <Badge variant="secondary" className="mb-4">
              Out of Stock
            </Badge>
          )}
          {isLowStock && (
            <Badge variant="warning" className="mb-4">
              Only {product.stock_quantity} left in stock
            </Badge>
          )}

          {/* Add to cart */}
          <div className="mb-8">
            <AddToCartButton product={product} disabled={isOutOfStock} />
          </div>

          <Separator className="my-6" />

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Dietary Info */}
          {(product.is_vegan || product.is_vegetarian || product.is_gluten_free || product.is_organic) && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Dietary Information</h2>
              <div className="flex flex-wrap gap-2">
                {product.is_vegan && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" /> Vegan
                  </Badge>
                )}
                {product.is_vegetarian && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" /> Vegetarian
                  </Badge>
                )}
                {product.is_gluten_free && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" /> Gluten Free
                  </Badge>
                )}
                {product.is_organic && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" /> Organic
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Allergens */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Allergens</h2>
              <p className="text-gray-600">
                Contains: {product.allergens.join(', ')}
              </p>
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-gray-400">
              SKU: {product.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
