'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Grid,
  List,
  Loader2,
  SlidersHorizontal,
  Star,
  ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils/format'
import { AddToCartButton } from '@/components/products/add-to-cart-button'
import { WishlistButton } from '@/components/wishlist'

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

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get current filters from URL
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

  const [searchInput, setSearchInput] = useState(query)

  // Fetch search results
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

  // Update URL with new params
  const updateFilters = (newParams: Record<string, string | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || value === false) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    // Reset to page 1 when filters change
    if (!('page' in newParams)) {
      params.set('page', '1')
    }

    router.push(`/search?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ q: searchInput })
  }

  const clearAllFilters = () => {
    router.push(`/search${query ? `?q=${query}` : ''}` as any)
  }

  const activeFiltersCount = [category, minPrice, maxPrice, inStock, onSale, organic, vegan, vegetarian, glutenFree]
    .filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for groceries..."
                className="pl-12 h-12 text-lg"
              />
            </div>
            <Button type="submit" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700">
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {query && (
              <h1 className="text-2xl font-bold text-gray-900">
                Results for "{query}"
              </h1>
            )}
            <p className="text-gray-500">
              {results?.total || 0} products found
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center gap-1 bg-white border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="h-10 px-3 border rounded-lg bg-white text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* Filter Button (Mobile) */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-emerald-600">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'fixed inset-0 z-50 bg-white md:relative md:inset-auto md:z-auto' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="p-4 md:p-0">
              <div className="flex items-center justify-between mb-4 md:hidden">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Active Filters */}
                {activeFiltersCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Active Filters</span>
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category && (
                        <Badge variant="secondary" className="gap-1">
                          {category}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ category: null })} />
                        </Badge>
                      )}
                      {onSale && (
                        <Badge variant="secondary" className="gap-1">
                          On Sale
                          <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ onSale: false })} />
                        </Badge>
                      )}
                      {organic && (
                        <Badge variant="secondary" className="gap-1">
                          Organic
                          <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ organic: false })} />
                        </Badge>
                      )}
                      {vegan && (
                        <Badge variant="secondary" className="gap-1">
                          Vegan
                          <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ vegan: false })} />
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
                  <div className="space-y-2">
                    {results?.facets.categories.slice(0, 10).map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={category === cat.slug}
                          onChange={() => updateFilters({ category: cat.slug })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice ? (parseInt(minPrice) / 100).toString() : ''}
                      onChange={(e) => updateFilters({ minPrice: e.target.value ? (parseFloat(e.target.value) * 100).toString() : null })}
                      className="w-20"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice ? (parseInt(maxPrice) / 100).toString() : ''}
                      onChange={(e) => updateFilters({ maxPrice: e.target.value ? (parseFloat(e.target.value) * 100).toString() : null })}
                      className="w-20"
                    />
                  </div>
                </div>

                {/* Dietary */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Dietary</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={organic}
                        onChange={(e) => updateFilters({ organic: e.target.checked })}
                        className="text-emerald-600 focus:ring-emerald-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Organic</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vegan}
                        onChange={(e) => updateFilters({ vegan: e.target.checked })}
                        className="text-emerald-600 focus:ring-emerald-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Vegan</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vegetarian}
                        onChange={(e) => updateFilters({ vegetarian: e.target.checked })}
                        className="text-emerald-600 focus:ring-emerald-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={glutenFree}
                        onChange={(e) => updateFilters({ glutenFree: e.target.checked })}
                        className="text-emerald-600 focus:ring-emerald-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Gluten Free</span>
                    </label>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Availability</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStock}
                        onChange={(e) => updateFilters({ inStock: e.target.checked })}
                        className="text-emerald-600 focus:ring-emerald-500 rounded"
                      />
                      <span className="text-sm text-gray-700">In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onSale}
                        onChange={(e) => updateFilters({ onSale: e.target.checked })}
                        className="text-emerald-600 focus:ring-emerald-500 rounded"
                      />
                      <span className="text-sm text-gray-700">On Sale</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Apply Button (Mobile) */}
              <div className="mt-6 md:hidden">
                <Button
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : results?.products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search or filters
                  </p>
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Product Grid */}
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                  {results?.products.map((product) => (
                    <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                      <Link href={`/products/${product.slug}`}>
                        <div className={`relative ${viewMode === 'list' ? 'flex' : ''}`}>
                          <div className={`relative ${viewMode === 'list' ? 'w-40 h-40' : 'aspect-square'} bg-gray-100`}>
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-12 w-12 text-gray-300" />
                              </div>
                            )}
                            {product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence && (
                              <Badge className="absolute top-2 left-2 bg-red-500">
                                Sale
                              </Badge>
                            )}
                          </div>

                          <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                            {product.brand && (
                              <p className="text-xs text-emerald-600 font-medium mb-1">{product.brand}</p>
                            )}
                            <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-emerald-600">
                              {product.name}
                            </h3>

                            {product.avg_rating > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">
                                  {product.avg_rating.toFixed(1)} ({product.review_count})
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(product.price_pence)}
                              </span>
                              {product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence && (
                                <span className="text-sm text-gray-400 line-through">
                                  {formatPrice(product.compare_at_price_pence)}
                                </span>
                              )}
                            </div>

                            {product.unit && product.unit !== 'each' && (
                              <p className="text-xs text-gray-500 mt-1">
                                {product.unit_value} {product.unit}
                              </p>
                            )}
                          </CardContent>
                        </div>
                      </Link>
                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <AddToCartButton product={product} size="sm" />
                          </div>
                          <WishlistButton productId={product.id} isLoggedIn={true} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {results && results.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => updateFilters({ page: (page - 1).toString() })}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {results.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => updateFilters({ page: (page + 1).toString() })}
                      disabled={page === results.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
