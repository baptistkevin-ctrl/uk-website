import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Grid3X3,
  Sparkles,
} from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Categories | Fresh Groceries',
  description: 'Browse our product categories',
}

// Professional stock images for categories (Unsplash)
const categoryImages: Record<string, string> = {
  'fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&h=400&fit=crop&q=80',
  'fresh-fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&h=400&fit=crop&q=80',
  'vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop&q=80',
  'fresh-vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop&q=80',
  'fruits-vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&h=400&fit=crop&q=80',
  'meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop&q=80',
  'meat-poultry': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop&q=80',
  'poultry': 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=600&h=400&fit=crop&q=80',
  'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=600&h=400&fit=crop&q=80',
  'dairy': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&h=400&fit=crop&q=80',
  'dairy-eggs': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&h=400&fit=crop&q=80',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop&q=80',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop&q=80',
  'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&h=400&fit=crop&q=80',
  'snacks-sweets': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&h=400&fit=crop&q=80',
  'beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop&q=80',
  'drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop&q=80',
  'alcohol': 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=600&h=400&fit=crop&q=80',
  'wine': 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=600&h=400&fit=crop&q=80',
  'beer': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop&q=80',
  'frozen': 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&h=400&fit=crop&q=80',
  'frozen-foods': 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&h=400&fit=crop&q=80',
  'seafood': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&h=400&fit=crop&q=80',
  'fish': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&h=400&fit=crop&q=80',
  'fish-seafood': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&h=400&fit=crop&q=80',
  'pantry': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&h=400&fit=crop&q=80',
  'household': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&h=400&fit=crop&q=80',
  'cleaning': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&h=400&fit=crop&q=80',
  'health-beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop&q=80',
  'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop&q=80',
  'baby': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=400&fit=crop&q=80',
  'baby-products': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=400&fit=crop&q=80',
  'organic': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop&q=80',
  'pets': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=400&fit=crop&q=80',
  'pet-food': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=400&fit=crop&q=80',
  'desserts': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop&q=80',
  'cakes': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop&q=80',
  'coffee': 'https://images.unsplash.com/photo-1447933601403-56dc2df6e3f5?w=600&h=400&fit=crop&q=80',
  'tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop&q=80',
}

const defaultCategoryImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop&q=80'

function getCategoryImage(slug: string, dbImage?: string | null): string {
  if (dbImage) return dbImage
  const lowerSlug = slug.toLowerCase()
  for (const key of Object.keys(categoryImages)) {
    if (lowerSlug.includes(key)) {
      return categoryImages[key]
    }
  }
  return defaultCategoryImage
}

export default async function CategoriesPage() {
  const supabase = getSupabaseAdmin()

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
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((category) => {
              const imageUrl = getCategoryImage(category.slug, category.image_url)

              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group block"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-sm hover:shadow-xl transition-all duration-300">
                    {/* Real Photo Background */}
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 group-hover:from-black/70 transition-colors duration-300" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-5">
                      <h2 className="text-white font-bold text-lg lg:text-xl mb-1 drop-shadow-sm">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-white/70 text-xs lg:text-sm line-clamp-1 mb-2">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center text-emerald-300 font-medium text-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <span>Browse Products</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
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
