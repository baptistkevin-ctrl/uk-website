import Link from 'next/link'
import {
  ArrowRight,
  Grid3X3,
  Sparkles,
  ShoppingBasket,
  Apple,
  Beef,
  Milk,
  Croissant,
  Cookie,
  Coffee,
  Wine,
  Snowflake,
  Package
} from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Categories | Fresh Groceries',
  description: 'Browse our product categories',
}

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'fruits': <Apple className="h-8 w-8" />,
  'vegetables': <ShoppingBasket className="h-8 w-8" />,
  'meat': <Beef className="h-8 w-8" />,
  'dairy': <Milk className="h-8 w-8" />,
  'bakery': <Croissant className="h-8 w-8" />,
  'snacks': <Cookie className="h-8 w-8" />,
  'beverages': <Coffee className="h-8 w-8" />,
  'alcohol': <Wine className="h-8 w-8" />,
  'frozen': <Snowflake className="h-8 w-8" />,
  'default': <Package className="h-8 w-8" />,
}

// Gradient colors for categories
const categoryColors = [
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
  { bg: 'from-blue-500 to-cyan-600', light: 'bg-blue-50 border-blue-100', text: 'text-blue-600' },
  { bg: 'from-purple-500 to-violet-600', light: 'bg-purple-50 border-purple-100', text: 'text-purple-600' },
  { bg: 'from-orange-500 to-amber-600', light: 'bg-orange-50 border-orange-100', text: 'text-orange-600' },
  { bg: 'from-pink-500 to-rose-600', light: 'bg-pink-50 border-pink-100', text: 'text-pink-600' },
  { bg: 'from-indigo-500 to-blue-600', light: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-600' },
  { bg: 'from-red-500 to-rose-600', light: 'bg-red-50 border-red-100', text: 'text-red-600' },
  { bg: 'from-teal-500 to-cyan-600', light: 'bg-teal-50 border-teal-100', text: 'text-teal-600' },
]

function getCategoryIcon(slug: string) {
  const lowerSlug = slug.toLowerCase()
  for (const key of Object.keys(categoryIcons)) {
    if (lowerSlug.includes(key)) {
      return categoryIcons[key]
    }
  }
  return categoryIcons['default']
}

export default async function CategoriesPage() {
  const supabase = getSupabaseAdmin()

  // Fetch top-level categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('display_order')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 py-12 lg:py-16 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Grid3X3 className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Browse by Category
              </Badge>
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Shop by <span className="text-emerald-200">Category</span>
            </h1>
            <p className="text-lg text-emerald-100 max-w-2xl">
              Explore our carefully organized categories to find exactly what you need.
              From fresh produce to pantry staples, we have got you covered.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-12">
        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const colorScheme = categoryColors[index % categoryColors.length]
              const icon = getCategoryIcon(category.slug)

              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 h-full">
                    {/* Gradient Top Bar */}
                    <div className={`h-2 bg-gradient-to-r ${colorScheme.bg}`} />

                    <div className="p-6">
                      {/* Icon */}
                      <div className={`w-16 h-16 ${colorScheme.light} border rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <div className={colorScheme.text}>
                          {icon}
                        </div>
                      </div>

                      {/* Content */}
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                          {category.description}
                        </p>
                      )}

                      {/* Arrow */}
                      <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:text-emerald-700">
                        <span>Browse Products</span>
                        <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Grid3X3 className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-500 mb-6">Categories will appear here once they are added.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              Browse All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        {categories && categories.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500 mb-4">Can&apos;t find what you&apos;re looking for?</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              Browse All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
