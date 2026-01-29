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

export const dynamic = 'force-dynamic'

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
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
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
  'from-green-400 to-emerald-500',
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
  let heroSlides = null
  if (heroSlidesEnabled) {
    const { data } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    heroSlides = data
  }

  // Fetch categories from database
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null) // Only top-level categories
    .order('display_order', { ascending: true })
    .limit(6)

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(8)

  // Fetch active flash deals
  const { data: flashDeals } = await supabase
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        {/* Hero Slider */}
        {heroSlidesEnabled && heroSlides && heroSlides.length > 0 ? (
          <HeroSlider slides={heroSlides} />
        ) : (
          /* Default Hero Section when no slides */
          <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute top-60 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="container mx-auto px-4 py-20 lg:py-32 relative">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Free delivery on orders over £50</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Fresh Groceries
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    Delivered Fast
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-emerald-100 mb-8 max-w-xl">
                  Shop thousands of quality products from the comfort of your home.
                  Same-day delivery across the UK, fresh to your door.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="h-14 px-8 bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl shadow-black/20 text-base font-semibold"
                    asChild
                  >
                    <Link href="/products">
                      Start Shopping
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-base font-semibold"
                    asChild
                  >
                    <Link href="/categories">Explore Categories</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="py-8 -mt-1 bg-white relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl lg:text-4xl font-bold text-gray-900">
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

        {/* Features */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Why Choose FreshMart?
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
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
        <section className="py-16 lg:py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Shop by Category
                </h2>
                <p className="text-gray-500">Find exactly what you&apos;re looking for</p>
              </div>
              <Link
                href="/categories"
                className="hidden sm:flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold group"
              >
                View All
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {dbCategories && dbCategories.length > 0 ? (
                dbCategories.map((category, index) => (
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
                      <h3 className="font-semibold text-center text-sm lg:text-base w-full">
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

            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 text-emerald-600 font-semibold"
              >
                View All Categories
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Flash Deals Section */}
        {flashDeals && flashDeals.length > 0 && (
          <section className="py-16 lg:py-20 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Flame className="h-3 w-3" />
                      HOT DEALS
                    </div>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Flash Deals
                  </h2>
                  <p className="text-gray-500 mt-1">Limited time offers - grab them before they're gone!</p>
                </div>
                <Link
                  href="/deals"
                  className="hidden sm:flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold group"
                >
                  View All Deals
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {flashDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>

              <div className="mt-8 text-center sm:hidden">
                <Link
                  href="/deals"
                  className="inline-flex items-center gap-2 text-orange-600 font-semibold"
                >
                  View All Deals
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">
                    Hand-picked for you
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Featured Products
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold group"
              >
                View All
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {featuredProducts && featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50 rounded-2xl">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No featured products yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Check back soon for our hand-picked selections!
                </p>
                <Button asChild>
                  <Link href="/products">Browse All Products</Link>
                </Button>
              </div>
            )}

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-emerald-600 font-semibold"
              >
                View All Products
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-24 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Decorative circles */}
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-teal-500/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Limited Time Offer</span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Free Delivery on Your First Order
            </h2>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-8">
              Join thousands of happy customers who save time and money by shopping with
              FreshMart. Quality groceries, delivered fresh to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="h-14 px-8 bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl text-base font-semibold"
                asChild
              >
                <Link href="/products">
                  Start Shopping Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 border-2 border-white/30 text-white hover:bg-white/10 text-base font-semibold"
                asChild
              >
                <Link href="/register">Create Account</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-8">
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
