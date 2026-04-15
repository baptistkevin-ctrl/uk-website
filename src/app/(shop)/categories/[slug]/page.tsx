import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/product-card'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CategoryHeroBanner } from '@/components/product/CategoryHeroBanner'
import { SubcategoryPills } from '@/components/product/SubcategoryPills'
import { CategoryFilters, ActiveFilterTags } from '@/components/product/CategoryFilters'
import { Suspense } from 'react'
import type { Metadata } from 'next'

// ISR: revalidate category product pages every 2 minutes
export const revalidate = 120

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
      .select('*, vendor:vendors(id, business_name, slug, is_verified)')
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

  // Build breadcrumb items
  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
  ]

  if (parentCategory) {
    breadcrumbItems.push({
      label: parentCategory.name,
      href: `/categories/${parentCategory.slug}`,
    })
  }

  breadcrumbItems.push({ label: category.name })

  return (
    <div className="min-h-screen bg-background">
      <Container size="xl">
        {/* Breadcrumb */}
        <div className="pt-4 pb-2">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </Container>

      {/* Category Hero Banner */}
      <CategoryHeroBanner
        name={category.name}
        description={category.description}
        itemCount={products.length}
        imageUrl={category.image_url}
      />

      <Container size="xl" className="py-6 lg:py-8">
        {/* Subcategory Pills */}
        {subcategories && subcategories.length > 0 && (
          <div className="mb-6 lg:mb-8">
            <SubcategoryPills
              items={subcategories}
              basePath="/categories"
            />
          </div>
        )}

        {/* Main Content — 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Filter Sidebar — desktop only */}
          <aside className="hidden lg:block w-65 shrink-0">
            <Suspense fallback={<div className="rounded-xl bg-(--color-surface) border border-(--color-border) p-5 h-80 animate-pulse" />}>
              <CategoryFilters
                brands={[...new Set(products.map((p: { brand?: string | null }) => p.brand).filter(Boolean) as string[])]}
                maxPrice={Math.max(...products.map((p: { price_pence: number }) => p.price_pence), 0) / 100}
              />
            </Suspense>
          </aside>

          {/* Right Content */}
          <div className="flex-1 min-w-0">
            {products.length > 0 ? (
              <>
                {/* Active Filter Tags */}
                <Suspense fallback={null}>
                  <ActiveFilterTags />
                </Suspense>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-(--color-text-muted)">
                    Showing{' '}
                    <span className="font-semibold text-foreground">
                      {products.length}
                    </span>{' '}
                    {products.length === 1 ? 'product' : 'products'}
                  </p>

                  <select
                    className="text-sm bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2.5 text-(--color-text-secondary) focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30"
                    defaultValue="name"
                  >
                    <option value="name">Sort by: Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-16 rounded-2xl bg-(--color-surface) border border-(--color-border)">
                <div className="w-20 h-20 bg-(--color-elevated) rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-(--color-text-muted)" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No products yet
                </h3>
                <p className="text-(--color-text-muted) mb-6 max-w-sm mx-auto text-sm">
                  We&apos;re still stocking up this category. Check back soon or
                  browse our other products.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-(--brand-primary) text-white font-medium text-sm hover:bg-(--brand-dark) transition-colors"
                >
                  Browse All Products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
