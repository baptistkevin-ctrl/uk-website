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
  ChevronRight,
  Store
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AddToCartButton } from '@/components/products/add-to-cart-button'
import { StarRatingCompact, ReviewList } from '@/components/reviews'
import { WishlistButton } from '@/components/wishlist'
import { VendorBadge } from '@/components/store'
import { VendorChatButton } from '@/components/chat/vendor-chat-button'
import { ProductViewTracker } from '@/components/products/product-view-tracker'
import { ProductGallery } from '@/components/products/product-gallery'
import { StockAlertButton } from '@/components/products/stock-alert-button'
import { ProductQA } from '@/components/products/product-qa'
import { ProductSchema } from '@/components/seo/ProductSchema'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import type { Metadata } from 'next'

// ISR: revalidate product pages every 2 minutes (price/stock can change)
export const revalidate = 120

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

  const title = product.meta_title || `${product.name} | UK Grocery Store`
  const description = product.meta_description || product.short_description || product.description || `Buy ${product.name} online at UK Grocery Store. Fresh groceries delivered to your door.`
  const productUrl = `https://uk-grocery-store.com/products/${slug}`
  const imageUrl = product.image_url || 'https://uk-grocery-store.com/og-default.jpg'

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: 'UK Grocery Store',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Get user auth status
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // Get product with vendor info
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(
        id,
        business_name,
        slug,
        logo_url,
        is_verified
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !product) {
    notFound()
  }

  const vendor = product.vendor as {
    id: string
    business_name: string
    slug: string
    logo_url: string | null
    is_verified: boolean
  } | null

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

  // Fetch related products (same vendor or random active products)
  let relatedProducts: { id: string; name: string; slug: string; image_url: string | null; price_pence: number; compare_at_price_pence: number | null }[] = []
  const { data: related } = await supabase
    .from('products')
    .select('id, name, slug, image_url, price_pence, compare_at_price_pence')
    .eq('is_active', true)
    .neq('id', product.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (related) {
    relatedProducts = related
  }

  // Delivery estimate: cutoff is 2pm for next-day delivery
  const now = new Date()
  const cutoffHour = 14
  const hoursUntilCutoff = cutoffHour - now.getHours()
  const minutesUntilCutoff = 60 - now.getMinutes()
  const canGetNextDay = hoursUntilCutoff > 0 || (hoursUntilCutoff === 0 && minutesUntilCutoff > 0)
  const deliveryEstimate = canGetNextDay
    ? `Order within ${hoursUntilCutoff > 0 ? `${hoursUntilCutoff}h ${minutesUntilCutoff}m` : `${minutesUntilCutoff}m`} for next-day delivery`
    : 'Order now for delivery in 2 days'

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="text-(--color-text-muted) hover:text-(--brand-primary) transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-(--color-text-disabled)" />
            <li>
              <Link href="/products" className="text-(--color-text-muted) hover:text-(--brand-primary) transition-colors">
                Products
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-(--color-text-disabled)" />
            <li className="text-foreground font-medium truncate max-w-50">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              {/* Product Gallery Component */}
              <ProductGallery
                images={[
                  ...(product.image_url ? [product.image_url] : []),
                  ...(product.images || [])
                ].filter(Boolean)}
                productName={product.name}
                showThumbnails={true}
                showZoom={true}
                showLightbox={true}
              />

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                {hasDiscount && (
                  <Badge className="bg-(--color-error) hover:bg-(--color-error) text-white shadow-lg text-sm font-bold px-3 py-1">
                    -{discountPercentage}% OFF
                  </Badge>
                )}
                {product.is_featured && (
                  <Badge className="bg-(--brand-amber) hover:bg-(--brand-amber) text-white shadow-lg text-sm font-bold px-3 py-1">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Stock Status Overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-(--color-surface)/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-(--color-elevated) rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package className="h-8 w-8 text-(--color-text-disabled)" />
                    </div>
                    <Badge className="bg-(--color-text) text-white text-lg px-4 py-2">
                      Out of Stock
                    </Badge>
                  </div>
                </div>
              )}

              {isLowStock && !isOutOfStock && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="bg-(--brand-amber-soft) border border-(--brand-amber) rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-(--brand-amber) shrink-0" />
                    <span className="text-sm font-medium text-(--brand-amber)">
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
                  <Badge key={key} variant="outline" className="bg-(--color-surface) border-(--brand-primary) text-(--brand-primary) px-3 py-1.5">
                    <Icon className="h-4 w-4 mr-1.5" />
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="lg:py-4">
            {/* Brand & Vendor */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {product.brand && (
                <span className="text-(--brand-primary) font-medium">{product.brand}</span>
              )}
              {vendor && (
                <>
                  {product.brand && <span className="text-(--color-text-disabled)">•</span>}
                  <VendorBadge vendor={vendor} />
                  <span className="text-(--color-text-disabled)">•</span>
                  <VendorChatButton
                    vendorId={vendor.id}
                    vendorName={vendor.business_name}
                    productSlug={product.slug}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-(--brand-primary) bg-(--brand-primary-light) border border-(--brand-primary) rounded-md hover:opacity-80 transition-colors"
                  />
                </>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 leading-tight">
              {product.name}
            </h1>

            {/* Star Rating */}
            {product.avg_rating > 0 && (
              <div className="mb-4">
                <StarRatingCompact
                  rating={product.avg_rating}
                  reviewCount={product.review_count}
                  size="md"
                />
              </div>
            )}

            {/* Short Description */}
            {product.short_description && (
              <p className="text-lg text-(--color-text-secondary) mb-6">
                {product.short_description}
              </p>
            )}

            {/* Price Card */}
            <Card className="border-(--color-border) shadow-lg mb-6 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-foreground">
                        {formatPrice(product.price_pence)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xl text-(--color-text-disabled) line-through">
                          {formatPrice(product.compare_at_price_pence!)}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-(--brand-primary) font-semibold mt-1">
                        You save {formatPrice(savingsAmount)}
                      </p>
                    )}
                    {product.unit && product.unit !== 'each' && (
                      <p className="text-(--color-text-muted) text-sm mt-1">
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
                          className="flex items-center gap-1.5 bg-(--brand-primary-light) text-(--brand-primary) px-3 py-1.5 rounded-full text-sm font-medium"
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

            {/* Add to Cart & Wishlist */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <AddToCartButton product={product} disabled={isOutOfStock} />
                </div>
                <WishlistButton
                  productId={product.id}
                  isLoggedIn={isLoggedIn}
                  size="lg"
                />
              </div>

              {/* Stock Alert - shown when out of stock */}
              {isOutOfStock && (
                <div className="mt-4">
                  <StockAlertButton
                    productId={product.id}
                    productName={product.name}
                    isLoggedIn={isLoggedIn}
                  />
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-8">
              <div className="text-center p-2.5 sm:p-4 bg-(--color-elevated) rounded-xl">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-(--brand-primary)" />
                </div>
                <p className="text-xs font-medium text-(--color-text-secondary)">Free Delivery</p>
                <p className="text-xs text-(--color-text-muted)">Over £50</p>
              </div>
              <div className="text-center p-2.5 sm:p-4 bg-(--color-elevated) rounded-xl">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-(--brand-primary)" />
                </div>
                <p className="text-xs font-medium text-(--color-text-secondary)">Quality</p>
                <p className="text-xs text-(--color-text-muted)">Guaranteed</p>
              </div>
              <div className="text-center p-2.5 sm:p-4 bg-(--color-elevated) rounded-xl">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-(--brand-primary)" />
                </div>
                <p className="text-xs font-medium text-(--color-text-secondary)">Same Day</p>
                <p className="text-xs text-(--color-text-muted)">Delivery</p>
              </div>
            </div>

            {/* Delivery Estimate */}
            {!isOutOfStock && (
              <div className="mb-8 flex items-center gap-3 p-4 bg-(--brand-primary)/5 border border-(--brand-primary)/20 rounded-xl">
                <Truck className="h-5 w-5 text-(--brand-primary) shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{deliveryEstimate}</p>
                  <p className="text-xs text-(--color-text-muted)">Free delivery on orders over £50</p>
                </div>
              </div>
            )}

            <Separator className="my-8" />

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-(--brand-primary)" />
                  </div>
                  Product Description
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-(--color-text-secondary) whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>
            )}

            {/* Dietary Information */}
            {dietaryInfo.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                    <Check className="h-4 w-4 text-(--brand-primary)" />
                  </div>
                  Dietary Information
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {dietaryInfo.map(({ key, label, icon: Icon }) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 bg-(--brand-primary-light) rounded-xl border border-(--brand-primary)"
                    >
                      <div className="w-10 h-10 bg-(--brand-primary) rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="text-xs text-(--brand-primary)">Certified</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens */}
            {product.allergens && product.allergens.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-(--brand-amber-soft) rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-(--brand-amber)" />
                  </div>
                  Allergen Information
                </h2>
                <div className="bg-(--brand-amber-soft) border border-(--brand-amber) rounded-xl p-4">
                  <p className="text-(--brand-amber)">
                    <span className="font-semibold">Contains:</span>{' '}
                    {product.allergens.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-(--color-text-disabled)">
                SKU: {product.sku}
              </p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <Separator className="mb-8" />
          <ReviewList
            productId={product.id}
            avgRating={product.avg_rating || 0}
            reviewCount={product.review_count || 0}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* Q&A Section */}
        <div className="mt-12">
          <Separator className="mb-8" />
          <ProductQA productSlug={slug} isLoggedIn={isLoggedIn} />
        </div>

        {/* Customers Also Viewed */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <h2 className="text-xl font-bold text-foreground mb-6">Customers Also Viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {relatedProducts.map((rp: { id: string; name: string; slug: string; image_url: string | null; price_pence: number; compare_at_price_pence: number | null }) => (
                <Link key={rp.id} href={`/products/${rp.slug}`} className="group rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden hover:shadow-md hover:border-(--brand-primary) transition-all">
                  <div className="aspect-square bg-(--color-elevated) relative overflow-hidden">
                    {rp.image_url ? (
                      <Image src={rp.image_url} alt={rp.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-(--color-text-disabled)" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-(--brand-primary) transition-colors">{rp.name}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-bold text-foreground">{formatPrice(rp.price_pence)}</span>
                      {rp.compare_at_price_pence && rp.compare_at_price_pence > rp.price_pence && (
                        <span className="text-xs text-(--color-text-disabled) line-through">{formatPrice(rp.compare_at_price_pence)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Products + View Tracking */}
        <ProductViewTracker product={product} />

        {/* Back to Products */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Products
          </Link>
        </div>
      </div>

      {/* Product Schema JSON-LD */}
      <ProductSchema
        product={{
          name: product.name,
          description: product.description || product.short_description || product.name,
          images: [product.image_url, ...(product.images || [])].filter(Boolean) as string[],
          brand: product.brand || undefined,
          slug: product.slug,
          price: product.price_pence / 100,
          inStock: isOutOfStock ? 0 : (product.stock_quantity ?? 999),
          rating: product.avg_rating || undefined,
          reviewCount: product.review_count || undefined,
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', href: '/' },
          { name: 'Products', href: '/products' },
          { name: product.name, href: `/products/${product.slug}` },
        ]}
      />
    </div>
  )
}
