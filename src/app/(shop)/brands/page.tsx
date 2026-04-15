'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Loader2, Package, Building2, ArrowRight } from 'lucide-react'

interface Brand {
  name: string
  slug: string
  product_count: number
  images: string[]
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('/api/brands?limit=100')
        const data = await res.json()
        if (Array.isArray(data)) {
          setBrands(data)
        }
      } catch (error) {
        console.error('Error fetching brands:', error)
      }
      setLoading(false)
    }
    fetchBrands()
  }, [])

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group brands by first letter
  const groupedBrands = filteredBrands.reduce((acc, brand) => {
    const firstLetter = brand.name.charAt(0).toUpperCase()
    if (!acc[firstLetter]) {
      acc[firstLetter] = []
    }
    acc[firstLetter].push(brand)
    return acc
  }, {} as Record<string, Brand[]>)

  const sortedLetters = Object.keys(groupedBrands).sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-(--color-surface) border-b border-(--color-border)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Shop by Brand</h1>
              <p className="text-(--color-text-muted) mt-1">{brands.length} brands available</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-text-disabled)" />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Brands */}
      {!searchQuery && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Featured Brands</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {brands.filter(b => b.product_count >= 3).slice(0, 12).map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4 hover:shadow-lg hover:border-(--brand-primary) transition-all group"
              >
                <div className="aspect-square mb-3 rounded-lg bg-(--color-elevated) overflow-hidden relative">
                  {brand.images[0] ? (
                    <Image
                      src={brand.images[0]}
                      alt={brand.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-(--color-text-disabled)" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-center truncate">{brand.name}</h3>
                <p className="text-sm text-(--color-text-muted) text-center">{brand.product_count} products</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Alphabetical List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold text-foreground mb-6">All Brands</h2>

        {filteredBrands.length === 0 ? (
          <div className="bg-(--color-surface) rounded-2xl p-12 text-center border border-(--color-border)">
            <Building2 className="w-16 h-16 text-(--color-text-disabled) mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No brands found</h3>
            <p className="text-(--color-text-muted)">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Alphabet Quick Jump */}
            <div className="flex flex-wrap gap-2">
              {sortedLetters.map((letter) => (
                <a
                  key={letter}
                  href={`#brand-${letter}`}
                  className="w-8 h-8 flex items-center justify-center bg-(--color-surface) border border-(--color-border) rounded-lg font-medium text-(--color-text-secondary) hover:bg-(--brand-primary-light) hover:text-(--brand-primary) hover:border-(--brand-primary) transition-colors"
                >
                  {letter}
                </a>
              ))}
            </div>

            {/* Brand Groups */}
            {sortedLetters.map((letter) => (
              <div key={letter} id={`brand-${letter}`}>
                <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-(--color-border)">
                  {letter}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedBrands[letter].map((brand) => (
                    <Link
                      key={brand.slug}
                      href={`/brands/${brand.slug}`}
                      className="flex items-center gap-4 bg-(--color-surface) rounded-xl border border-(--color-border) p-4 hover:shadow-md hover:border-(--brand-primary) transition-all group"
                    >
                      <div className="w-14 h-14 rounded-lg bg-(--color-elevated) overflow-hidden relative shrink-0">
                        {brand.images[0] ? (
                          <Image
                            src={brand.images[0]}
                            alt={brand.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-6 h-6 text-(--color-text-disabled)" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate group-hover:text-(--brand-primary) transition-colors">
                          {brand.name}
                        </h4>
                        <p className="text-sm text-(--color-text-muted)">{brand.product_count} products</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-(--color-text-disabled) group-hover:text-(--brand-primary) transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
