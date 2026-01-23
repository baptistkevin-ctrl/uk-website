import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingBag,
  ArrowLeft,
  Leaf,
  Check,
  Heart,
  Wheat,
  Star,
  Truck,
  Shield,
  Clock,
  Package,
  AlertTriangle,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
    title: product.meta_title || `${product.name} | Fresh Groceries`,
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
  const savingsAmount = hasDiscount ? product.compare_at_price_pence! - product.price_pence : 0

  const isOutOfStock = product.track_inventory && product.stock_quantity === 0 && !product.allow_backorder
  const isLowStock = product.track_inventory && product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0

  const dietaryInfo = [
    { key: 'vegan', label: 'Vegan', active: product.is_vegan, icon: Heart, color: 'emerald' },
    { key: 'vegetarian', label: 'Vegetarian', active: product.is_vegetarian, icon: Leaf, color: 'green' },
    { key: 'gluten_free', label: 'Gluten Free', active: product.is_gluten_free, icon: Wheat, color: 'amber' },
    { key: 'organic', label: 'Organic', active: product.is_organic, icon: Sparkles, color: 'lime' },
  ].filter(d => d.active)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-emerald-600 transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <li>
              <Link href="/products" className="text-gray-500 hover:text-emerald-600 transition-colors">
                Products
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <li className="text-gray-900 font-medium truncate max-w-[200px]">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-slate-400" />
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {hasDiscount && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-lg text-sm font-bold px-3 py-1">
                    -{discountPercentage}% OFF
                  </Badge>
                )}
                {product.is_featured && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg text-sm font-bold px-3 py-1">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Stock Status */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package className="h-8 w-8 text-slate-400" />
                    </div>
                    <Badge className="bg-slate-900 text-white text-lg px-4 py-2">
                      Out of Stock
                    </Badge>
                  </div>
                </div>
              )}

              {isLowStock && (
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-amber-100 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <span className="text-sm font-medium text-amber-800">
                      Only {product.stock_quantity} left in stock - order soon!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Dietary Badges - Mobile */}
            {dietaryInfo.length > 0 && (
              <div className="lg:hidden flex flex-wrap gap-2">
                {dietaryInfo.map(({ key, label, icon: Icon }) => (
                  <Badge key={key} variant="outline" className="bg-white border-emerald-200 text-emerald-700 px-3 py-1.5">
                    <Icon className="h-4 w-4 mr-1.5" />
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="lg:py-4">
            {/* Brand */}
            {product.brand && (
              <p className="text-emerald-600 font-medium mb-2">{product.brand}</p>
            )}

            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-lg text-gray-600 mb-6">
                {product.short_description}
              </p>
            )}

            {/* Price Card */}
            <Card className="border-slate-200 shadow-lg mb-6 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(product.price_pence)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xl text-gray-400 line-through">
                          {formatPrice(product.compare_at_price_pence!)}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-emerald-600 font-semibold mt-1">
                        You save {formatPrice(savingsAmount)}
                      </p>
                    )}
                    {product.unit && product.unit !== 'each' && (
                      <p className="text-gray-500 text-sm mt-1">
                        {product.unit_value} {product.unit}
                      </p>
                    )}
                  </div>

                  {/* Dietary Badges - Desktop */}
                  {dietaryInfo.length > 0 && (
                    <div className="hidden lg:flex flex-wrap gap-2">
                      {dietaryInfo.map(({ key, label, icon: Icon }) => (
                        <div
                          key={key}
                          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium"
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add to Cart */}
            <div className="mb-8">
              <AddToCartButton product={product} disabled={isOutOfStock} />
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Truck className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs font-medium text-gray-700">Free Delivery</p>
                <p className="text-xs text-gray-500">Over £50</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs font-medium text-gray-700">Quality</p>
                <p className="text-xs text-gray-500">Guaranteed</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs font-medium text-gray-700">Same Day</p>
                <p className="text-xs text-gray-500">Delivery</p>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-emerald-600" />
                  </div>
                  Product Description
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>
            )}

            {/* Dietary Information */}
            {dietaryInfo.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                  Dietary Information
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {dietaryInfo.map(({ key, label, icon: Icon }) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100"
                    >
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-900">{label}</p>
                        <p className="text-xs text-emerald-600">Certified</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens */}
            {product.allergens && product.allergens.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  Allergen Information
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-800">
                    <span className="font-semibold">Contains:</span>{' '}
                    {product.allergens.join(', ')}
                  </p>
                </div>
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

        {/* Back to Products */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Products
          </Link>
        </div>
      </div>
    </div>
  )
}
