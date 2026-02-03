'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { ZillyProductCard } from '@/components/products/zilly-product-card'

interface Product {
  id: string
  name: string
  slug: string
  price_pence: number
  compare_at_price_pence?: number | null
  image_url: string | null
  is_organic?: boolean
  is_vegan?: boolean
  is_vegetarian?: boolean
  short_description?: string | null
  category_id?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface FeaturedProductsProps {
  products: Product[]
  categories: Category[]
}

export function FeaturedProducts({ products, categories }: FeaturedProductsProps) {
  const [activeFilter, setActiveFilter] = useState('all')

  // Filter products based on active category
  const filteredProducts = activeFilter === 'all'
    ? products
    : products.filter(p => p.category_id === activeFilter)

  // Create filter tabs - All + first 4 categories that have products
  const filterTabs = [
    { id: 'all', name: 'All', count: products.length },
    ...categories
      .filter(cat => products.some(p => p.category_id === cat.id))
      .slice(0, 4)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        count: products.filter(p => p.category_id === cat.id).length
      }))
  ]

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        {/* Header with Filter Tabs - Zilly Style */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
            Featured Products
          </h2>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-4">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`text-sm transition-colors ${
                    activeFilter === tab.id
                      ? 'text-green-500 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name} ({tab.count})
                </button>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1 ml-4">
              <button className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
              <button className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid - Zilly Style */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.slice(0, 12).map((product) => (
              <ZillyProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No products found in this category.</p>
          </div>
        )}

        {/* View All Link */}
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-green-500 hover:text-green-600 font-medium text-sm"
          >
            View All Products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
