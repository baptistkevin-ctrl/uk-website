'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Spinner } from '@/components/ui/Spinner'
import { ProductCard } from '@/components/products/product-card'
import { useAuth } from '@/hooks/use-auth'

interface Product {
  id: string
  name: string
  slug: string
  short_description: string | null
  price_pence: number
  compare_at_price_pence: number | null
  image_url: string | null
  stock_quantity: number
  unit: string
  unit_value: number | null
  brand: string | null
  is_organic: boolean
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  has_offer: boolean
  offer_badge: string | null
  avg_rating: number
  review_count: number
  vendor: {
    id: string
    business_name: string
    slug: string
    is_verified: boolean
  } | null
  categories: Array<{
    category: {
      id: string
      name: string
      slug: string
    }
  }>
}

interface SearchResult {
  products: Product[]
  total: number
  page: number
  totalPages: number
  facets: {
    categories: Array<{ id: string; name: string; slug: string }>
    brands: string[]
    priceRange: { min: number; max: number }
  }
  query: string
}

const SUGGESTED_CATEGORIES = [
  { label: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
  { label: 'Dairy & Eggs', slug: 'dairy-eggs' },
  { label: 'Bakery', slug: 'bakery' },
  { label: 'Meat & Poultry', slug: 'meat-poultry' },
  { label: 'Beverages', slug: 'beverages' },
  { label: 'Snacks', slug: 'snacks' },
]

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const sort = searchParams.get('sort') || 'relevance'
  const category = searchParams.get('category') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const inStock = searchParams.get('inStock') === 'true'
  const onSale = searchParams.get('onSale') === 'true'
  const organic = searchParams.get('organic') === 'true'
  const vegan = searchParams.get('vegan') === 'true'
  const vegetarian = searchParams.get('vegetarian') === 'true'
  const glutenFree = searchParams.get('glutenFree') === 'true'

  const fetchResults = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      params.set('page', page.toString())
      params.set('sort', sort)
      if (category) params.set('category', category)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (inStock) params.set('inStock', 'true')
      if (onSale) params.set('onSale', 'true')
      if (organic) params.set('organic', 'true')
      if (vegan) params.set('vegan', 'true')
      if (vegetarian) params.set('vegetarian', 'true')
      if (glutenFree) params.set('glutenFree', 'true')

      const res = await fetch(`/api/search?${params.toString()}`)
      const data = await res.json()
      setResults(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [query, page, sort, category, minPrice, maxPrice, inStock, onSale, organic, vegan, vegetarian, glutenFree])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const updateFilters = (newParams: Record<string, string | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || value === false) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    if (!('page' in newParams)) {
      params.set('page', '1')
    }

    router.push(`/search?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push(`/search${query ? `?q=${query}` : ''}`)
  }

  const activeFilters: Array<{ key: string; label: string }> = []
  if (category) {
    const catName = results?.facets.categories.find(c => c.slug === category)?.name || category
    activeFilters.push({ key: 'category', label: catName })
  }
  if (onSale) activeFilters.push({ key: 'onSale', label: 'On Sale' })
  if (inStock) activeFilters.push({ key: 'inStock', label: 'In Stock' })
  if (organic) activeFilters.push({ key: 'organic', label: 'Organic' })
  if (vegan) activeFilters.push({ key: 'vegan', label: 'Vegan' })
  if (vegetarian) activeFilters.push({ key: 'vegetarian', label: 'Vegetarian' })
  if (glutenFree) activeFilters.push({ key: 'glutenFree', label: 'Gluten Free' })
  if (minPrice) activeFilters.push({ key: 'minPrice', label: `Min: £${(parseInt(minPrice) / 100).toFixed(2)}` })
  if (maxPrice) activeFilters.push({ key: 'maxPrice', label: `Max: £${(parseInt(maxPrice) / 100).toFixed(2)}` })

  const removeFilter = (key: string) => {
    if (key === 'category') return updateFilters({ category: null })
    if (key === 'minPrice') return updateFilters({ minPrice: null })
    if (key === 'maxPrice') return updateFilters({ maxPrice: null })
    return updateFilters({ [key]: false })
  }

  return (
    <div className="min-h-screen bg-background">
      <Container size="xl" className="py-6 lg:py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Search Results' },
          ]}
          className="mb-6"
        />

        {/* Query Header + Sort */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {query ? (
              <h1 className="font-display text-xl lg:text-2xl font-bold text-foreground">
                Results for &ldquo;{query}&rdquo;
              </h1>
            ) : (
              <h1 className="font-display text-xl lg:text-2xl font-bold text-foreground">
                All Products
              </h1>
            )}
            <p className="text-sm text-(--color-text-muted) mt-1">
              {results?.total ?? 0} {results?.total === 1 ? 'product' : 'products'} found
            </p>
          </div>

          <select
            value={sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="h-10 px-3 rounded-lg border border-(--color-border) bg-(--color-surface) text-sm text-foreground transition-colors duration-(--duration-fast) ease-(--ease-premium) focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary) w-fit"
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Active Filters Bar */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => removeFilter(filter.key)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-(--color-surface) border border-(--color-border) text-xs font-medium text-(--color-text-secondary) transition-all duration-(--duration-fast) ease-(--ease-premium) hover:border-(--brand-primary) hover:text-(--brand-primary) group"
              >
                {filter.label}
                <X size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-(--brand-primary) hover:underline px-2 py-1.5"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : results?.products.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search
              size={64}
              strokeWidth={1}
              className="text-(--color-text-muted) mb-6"
            />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              No results for &ldquo;{query}&rdquo;
            </h2>
            <p className="text-sm text-(--color-text-muted) mb-8 max-w-md">
              Try a different search term or browse our categories
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SUGGESTED_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="px-4 py-2.5 rounded-full bg-(--color-surface) border border-(--color-border) text-sm font-medium text-(--color-text-secondary) transition-all duration-(--duration-fast) ease-(--ease-premium) hover:border-(--brand-primary) hover:text-(--brand-primary) hover:shadow-(--shadow-sm)"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 mt-6">
              {results?.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLoggedIn={!!user}
                />
              ))}
            </div>

            {/* Pagination */}
            {results && results.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => updateFilters({ page: (page - 1).toString() })}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-(--color-border) bg-(--color-surface) text-sm font-medium text-(--color-text-secondary) transition-all duration-(--duration-fast) ease-(--ease-premium) hover:border-(--brand-primary) hover:text-(--brand-primary) disabled:opacity-40 disabled:pointer-events-none min-h-11"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-sm text-(--color-text-muted) px-3">
                  Page {page} of {results.totalPages}
                </span>
                <button
                  onClick={() => updateFilters({ page: (page + 1).toString() })}
                  disabled={page === results.totalPages}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-(--color-border) bg-(--color-surface) text-sm font-medium text-(--color-text-secondary) transition-all duration-(--duration-fast) ease-(--ease-premium) hover:border-(--brand-primary) hover:text-(--brand-primary) disabled:opacity-40 disabled:pointer-events-none min-h-11"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
