import Link from 'next/link'
import { ArrowRight, Truck, Shield, Clock, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/products/product-card'
import { createClient } from '@/lib/supabase/server'

const features = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Same-day delivery available on orders before 2pm',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    description: 'Fresh products or your money back',
  },
  {
    icon: Clock,
    title: 'Flexible Slots',
    description: 'Choose a delivery time that suits you',
  },
  {
    icon: Leaf,
    title: 'Fresh & Local',
    description: 'Supporting British farmers and producers',
  },
]

const categories = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs' },
  { name: 'Meat & Seafood', slug: 'meat-seafood' },
  { name: 'Bakery', slug: 'bakery' },
  { name: 'Frozen Foods', slug: 'frozen-foods' },
  { name: 'Beverages', slug: 'beverages' },
]

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(8)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-green-700 to-green-600 text-white">
          <div className="container mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Fresh Groceries Delivered to Your Door
              </h1>
              <p className="text-lg lg:text-xl text-green-100 mb-8">
                Shop thousands of quality products from the comfort of your home.
                Fast delivery across the UK.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50" asChild>
                  <Link href="/products">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/categories">Browse Categories</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 hidden lg:block">
            <div className="relative h-full w-full opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:40px_40px]" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Shop by Category
              </h2>
              <Link
                href="/categories"
                className="text-green-600 hover:text-green-700 font-medium flex items-center"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="group relative rounded-lg overflow-hidden bg-gradient-to-br from-green-50 to-green-100 aspect-square flex items-center justify-center hover:from-green-100 hover:to-green-200 transition-colors"
                >
                  <div className="text-center p-4">
                    <h3 className="text-gray-900 font-semibold text-sm lg:text-base group-hover:text-green-700 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 lg:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Featured Products
              </h2>
              <Link
                href="/products"
                className="text-green-600 hover:text-green-700 font-medium flex items-center"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            {featuredProducts && featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500">No featured products available yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Connect your Supabase database and run the migration to see products.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/products">Browse All Products</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-green-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Free Delivery on Orders Over £50
            </h2>
            <p className="text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of happy customers who save time and money by shopping
              with FreshMart. Quality groceries, delivered fresh.
            </p>
            <Button size="lg" className="bg-white text-green-700 hover:bg-green-50" asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
