import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/product-card'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

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
    title: category.name,
    description: category.description || `Shop ${category.name} at FreshMart`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = await createClient()

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/categories"
          className="inline-flex items-center text-sm text-gray-500 hover:text-green-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All Categories
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
      </div>

      {/* Subcategories */}
      {subcategories && subcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subcategories</h2>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className="px-4 py-2 bg-gray-100 hover:bg-green-100 rounded-full text-sm font-medium text-gray-700 hover:text-green-700 transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 mb-4">No products in this category yet.</p>
          <Button asChild>
            <Link href="/products">Browse All Products</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
