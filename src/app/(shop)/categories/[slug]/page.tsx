import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight,
  Grid3X3,
  Sparkles,
  Package,
  ArrowRight,
  ShoppingBasket,
  Filter
} from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabaseAdmin()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${category.name} | Fresh Groceries`,
    description: category.description || `Shop ${category.name} at Fresh Groceries`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = getSupabaseAdmin()

  // Fetch category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (categoryError || !category) {
    notFound()
  }

  // Fetch products in this category
  const { data: productCategories } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', category.id)

  const productIds = productCategories?.map((pc) => pc.product_id) || []

  let products = []
  if (productIds.length > 0) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true)
      .order('name')

    products = data || []
  }

  // Fetch subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', category.id)
    .eq('is_active', true)
    .order('display_order')

  // Fetch parent category if exists
  let parentCategory = null
  if (category.parent_id) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', category.parent_id)
      .single()
    parentCategory = data
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-500 via-green-600 to-teal-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 py-12 lg:py-16 relative">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/" className="text-green-200 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-4 w-4 text-emerald-300" />
              <li>
                <Link href="/categories" className="text-green-200 hover:text-white transition-colors">
                  Categories
                </Link>
              </li>
              {parentCategory && (
                <>
                  <ChevronRight className="h-4 w-4 text-emerald-300" />
                  <li>
                    <Link
                      href={`/categories/${parentCategory.slug}`}
                      className="text-green-200 hover:text-white transition-colors"
                    >
                      {parentCategory.name}
                    </Link>
                  </li>
                </>
              )}
              <ChevronRight className="h-4 w-4 text-emerald-300" />
              <li className="text-white font-medium">{category.name}</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Grid3X3 className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                {products.length} Products
              </Badge>
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-green-100 max-w-2xl">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Subcategories */}
        {subcategories && subcategories.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-green-500" />
              Subcategories
            </h2>
            <div className="flex flex-wrap gap-3">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/categories/${sub.slug}`}
                  className="group"
                >
                  <div className="px-5 py-3 bg-white border-2 border-slate-100 hover:border-green-200 rounded-xl text-sm font-medium text-gray-700 hover:text-green-600 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md">
                    <ShoppingBasket className="h-4 w-4 text-gray-400 group-hover:text-green-400" />
                    {sub.name}
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-green-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {products.length > 0 ? (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{products.length}</span> products in {category.name}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              We&apos;re still stocking up this category. Check back soon or browse our other products.
            </p>
            <Button asChild className="bg-green-500 hover:bg-green-600">
              <Link href="/products">
                Browse All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-500 font-medium transition-colors"
          >
            <Grid3X3 className="h-4 w-4" />
            View All Categories
          </Link>
          <span className="hidden sm:inline text-gray-300">|</span>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-green-500 hover:text-green-600 font-medium transition-colors"
          >
            Browse All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
