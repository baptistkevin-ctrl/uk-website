import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Truck,
  Shield,
  Clock,
  Leaf,
  Star,
  ChevronRight,
  Sparkles,
  Heart,
  Zap,
  Award,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/products/product-card'
import { HeroSlider } from '@/components/home/HeroSlider'
import { DealCard } from '@/components/deals'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// ISR: revalidate homepage every 60 seconds for fresh content + performance
export const revalidate = 60

const features = [
  {
    icon: Truck,
    title: 'Lightning Fast Delivery',
    description: 'Same-day delivery on orders before 2pm. Fresh to your door.',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    description: 'Not happy? Get a full refund. No questions asked.',
    color: 'from-green-400 to-teal-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-400',
  },
  {
    icon: Clock,
    title: 'Flexible Time Slots',
    description: 'Choose a delivery window that fits your schedule perfectly.',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    icon: Leaf,
    title: 'Fresh & Local',
    description: 'Supporting British farmers with locally sourced produce.',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
]

// Default gradient colors for categories without images
const categoryColors = [
  'from-green-400 to-green-400',
  'from-blue-400 to-cyan-500',
  'from-red-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-500',
  'from-purple-400 to-pink-500',
  'from-pink-400 to-rose-500',
  'from-indigo-400 to-purple-500',
]

const stats = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '5,000+', label: 'Products' },
  { value: '99.9%', label: 'On-time Delivery' },
  { value: '4.9', label: 'Customer Rating', icon: Star },
]

export default async function HomePage() {
  const supabase = getSupabaseAdmin()

  // Fetch settings to check if hero slides are enabled
  const { data: settings } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'enable_hero_slides')
    .single()

  const heroSlidesEnabled = settings?.value !== 'false' && settings?.value !== false

  // Fetch hero slides only if enabled
  let safeHeroSlides: any[] = []
  if (heroSlidesEnabled) {
    const { data, error: heroError } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    safeHeroSlides = heroError ? [] : data || []
  }

  // Fetch categories from database
  const { data: dbCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null) // Only top-level categories
    .order('display_order', { ascending: true })
    .limit(6)
  const safeCategories = categoriesError ? [] : dbCategories || []

  // Fetch active flash deals
  const { data: flashDeals, error: flashDealsError } = await supabase
    .from('flash_deals')
    .select(`
      *,
      product:products(
        id,
        name,
        slug,
        short_description,
        price_pence,
        compare_at_price_pence,
        image_url,
        is_organic,
        is_vegan
      )
    `)
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())
    .lte('starts_at', new Date().toISOString())
    .order('ends_at', { ascending: true })
    .limit(4)
  const safeFlashDeals = flashDealsError ? [] : flashDeals || []

  // Fetch ALL products for Amazon/AliExpress style display - NO LIMIT
  const { data: allProducts, error: productsError } = await supabase
    .from('products')
    .select('*, vendor:vendors(id, business_name, slug, is_verified)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  const safeAllProducts = productsError ? [] : allProducts || []

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30">
      <Header />
      <main className="flex-1">
        {/* Hero Section - Zilly Style */}
        <HeroSlider slides={safeHeroSlides || []} />

        {/* Stats Section - desktop only */}
        <section className="hidden lg:block py-4 bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-orange-50/60 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {stat.value}
                    </span>
                    {stat.icon && (
                      <stat.icon className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features - desktop only */}
        <section className="hidden lg:block py-10 bg-gradient-to-b from-orange-50/40 to-amber-50/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Why Choose FreshMart?
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm">
                We&apos;re committed to delivering the freshest groceries with unmatched
                convenience and service.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden"
                >
                  {/* Hover gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />

                  <div
                    className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-4 lg:py-10 bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-yellow-50/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-3 lg:mb-6">
              <div>
                <h2 className="text-lg lg:text-3xl font-bold text-gray-900 mb-0.5 lg:mb-1">
                  Shop by Category
                </h2>
                <p className="text-gray-500 text-xs lg:text-base">Find exactly what you&apos;re looking for</p>
              </div>
              <Link
                href="/categories"
                className="flex items-center gap-1 text-green-500 hover:text-green-600 font-semibold text-xs lg:text-base group"
              >
                View All
                <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Mobile: Horizontal scroll circular icons (AliExpress style) */}
            <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4 pb-2">
                {safeCategories && safeCategories.length > 0 ? (
                  safeCategories.map((category, index) => (
                    <Link
                      key={category.slug}
                      href={`/categories/${category.slug}`}
                      className="flex flex-col items-center gap-1.5 shrink-0 w-16"
                    >
                      <div className={`w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br ${categoryColors[index % categoryColors.length]} flex items-center justify-center shadow-sm`}>
                        {category.image_url ? (
                          <Image
                            src={category.image_url}
                            alt={category.name}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full rounded-full"
                          />
                        ) : (
                          <span className="text-white text-xl font-bold">
                            {category.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-700 text-center leading-tight line-clamp-2 font-medium">
                        {category.name}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No categories available.</p>
                )}
              </div>
            </div>

            {/* Desktop: Original grid layout */}
            <div className="hidden lg:grid grid-cols-6 gap-4">
              {safeCategories && safeCategories.length > 0 ? (
                safeCategories.map((category, index) => (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className="group relative rounded-2xl overflow-hidden aspect-square"
                  >
                    {category.image_url ? (
                      <>
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      </>
                    ) : (
                      <>
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${categoryColors[index % categoryColors.length]} opacity-90 group-hover:opacity-100 transition-opacity`}
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      </>
                    )}
                    <div className="relative h-full flex flex-col items-end justify-end p-4 text-white">
                      <h3 className="font-semibold text-center text-base w-full">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-xs text-white/80 mt-1 text-center w-full line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p>No categories available. Add categories in the admin panel.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Flash Deals Section */}
        {safeFlashDeals && safeFlashDeals.length > 0 && (
          <section className="py-4 lg:py-10 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-3 lg:mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 lg:px-3 py-1 rounded-full">
                      <Flame className="h-3 w-3" />
                      HOT DEALS
                    </div>
                  </div>
                  <h2 className="text-lg lg:text-3xl font-bold text-gray-900">
                    Flash Deals
                  </h2>
                  <p className="text-gray-500 text-xs lg:text-base mt-0.5 lg:mt-1">Limited time offers!</p>
                </div>
                <Link
                  href="/deals"
                  className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold text-xs lg:text-base group"
                >
                  View All
                  <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Mobile: Horizontal scroll deals */}
              <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-3 pb-2">
                  {safeFlashDeals.map((deal) => (
                    <div key={deal.id} className="shrink-0 w-[260px]">
                      <DealCard deal={deal} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden lg:grid grid-cols-4 gap-6">
                {safeFlashDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Products Section - Full Length AliExpress Style */}
        {safeAllProducts && safeAllProducts.length > 0 && (
          <section className="py-4 lg:py-10 bg-gradient-to-b from-orange-50/30 via-amber-50/40 to-orange-50/50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-3 lg:mb-6">
                <div>
                  <div className="flex items-center gap-2 lg:gap-3 mb-1 lg:mb-2">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-teal-500 text-white text-[10px] lg:text-xs font-bold px-2 lg:px-3 py-1 rounded-full">
                      <Sparkles className="h-3 w-3" />
                      ALL PRODUCTS
                    </div>
                    <span className="text-xs lg:text-sm text-gray-500">{safeAllProducts.length} items</span>
                  </div>
                  <h2 className="text-lg lg:text-3xl font-bold text-gray-900">
                    Explore All Products
                  </h2>
                  <p className="hidden lg:block text-gray-500 mt-1">Quality groceries from all our vendors</p>
                </div>
              </div>

              {/* Full Width Product Grid - AliExpress Style */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-4">
                {safeAllProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load More / View All Button */}
              <div className="mt-6 lg:mt-12 text-center">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-white border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white font-semibold px-6 lg:px-10 py-3 lg:py-4 rounded-full transition-all shadow-sm hover:shadow-md text-sm lg:text-base"
                >
                  View More Products
                  <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-6 lg:py-10 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600" />

          <div className="container mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Limited Time Offer</span>
            </div>

            <h2 className="text-2xl lg:text-4xl font-bold text-white mb-3">
              Free Delivery on Your First Order
            </h2>
            <p className="text-green-100 text-base max-w-2xl mx-auto mb-6">
              Join thousands of happy customers who save time and money by shopping with
              FreshMart. Quality groceries, delivered fresh to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="h-12 px-6 bg-white text-green-600 hover:bg-green-50 shadow-lg text-base font-semibold"
                asChild
              >
                <Link href="/products">
                  Start Shopping Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="h-12 px-6 bg-white/20 text-white border-2 border-white hover:bg-white hover:text-green-600 text-base font-semibold"
                asChild
              >
                <Link href="/register">Create Account</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2 text-white/80">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Truck className="h-5 w-5" />
                <span className="text-sm">Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Award className="h-5 w-5" />
                <span className="text-sm">Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Heart className="h-5 w-5" />
                <span className="text-sm">Customer Favourite</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

    </div>
  )
}
