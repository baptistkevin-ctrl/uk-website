'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Store,
  Search,
  MapPin,
  Star,
  CheckCircle,
  Package,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Navigation,
} from 'lucide-react'

interface Vendor {
  id: string
  business_name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  city: string | null
  rating: number
  review_count: number
  is_verified: boolean
  created_at: string
  product_count: number
  distance_km: number | null
}

interface StoreResponse {
  stores: Vendor[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    cities: string[]
  }
}

function StoresPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [stores, setStores] = useState<Vendor[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })
  const [cities, setCities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)

  // Geolocation state
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unavailable'>('idle')

  // Current filter values
  const currentPage = parseInt(searchParams.get('page') || '1')
  const currentSort = searchParams.get('sort') || 'popular'
  const currentCity = searchParams.get('city') || ''
  const currentVerified = searchParams.get('verified') === 'true'
  const currentSearch = searchParams.get('search') || ''

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable')
      return
    }
    // Try to get location silently
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setGeoStatus('granted')
      },
      () => {
        setGeoStatus('denied')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) return
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setGeoStatus('granted')
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  useEffect(() => {
    fetchStores()
  }, [searchParams.toString(), userLat, userLng])

  const fetchStores = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      // Append geo coords if available
      if (userLat !== null && userLng !== null) {
        params.set('lat', String(userLat))
        params.set('lng', String(userLng))
      }
      const res = await fetch(`/api/stores?${params.toString()}`)
      const data: StoreResponse = await res.json()
      setStores(data.stores)
      setPagination(data.pagination)
      setCities(data.filters.cities)
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Reset to page 1 when filters change
    if (!updates.hasOwnProperty('page')) {
      params.set('page', '1')
    }

    router.push(`/stores?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: searchQuery || null })
  }

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'nearest', label: 'Nearest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'A-Z' },
  ]

  const hasActiveFilters = currentCity || currentVerified || currentSearch

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-(--brand-dark) text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-(--color-surface)/20 rounded-2xl mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Store Directory</h1>
            <p className="text-white/70 max-w-2xl mx-auto">
              Discover quality vendors and local sellers. Browse our marketplace of trusted stores offering fresh groceries and specialty products.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-text-disabled)" />
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-24 py-3 rounded-xl bg-(--color-surface) text-foreground placeholder:text-(--color-text-disabled) focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-(--brand-primary) text-white rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Banner */}
        {geoStatus === 'denied' && (
          <div className="mb-6 bg-(--brand-amber-soft) border border-(--brand-amber) rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-(--brand-amber) shrink-0" />
              <p className="text-sm text-(--brand-amber)">
                Enable location to see nearest stores and distances. Your location is only used to sort stores.
              </p>
            </div>
            <button
              onClick={requestLocation}
              className="px-4 py-1.5 bg-(--brand-amber) text-white text-sm rounded-lg font-medium hover:opacity-90 transition-colors shrink-0"
            >
              Enable
            </button>
          </div>
        )}
        {geoStatus === 'granted' && currentSort !== 'nearest' && (
          <div className="mb-6 bg-(--brand-primary-light) border border-(--brand-primary) rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-(--brand-primary) shrink-0" />
              <p className="text-sm text-(--brand-primary)">
                Location detected! Sort by &quot;Nearest First&quot; to see stores closest to you.
              </p>
            </div>
            <button
              onClick={() => updateParams({ sort: 'nearest' })}
              className="px-4 py-1.5 bg-(--brand-primary) text-white text-sm rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors shrink-0"
            >
              Sort by Nearest
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-(--color-text-secondary)">
              {pagination.total} {pagination.total === 1 ? 'store' : 'stores'} found
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden inline-flex items-center gap-2 px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:bg-background"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-(--brand-primary) rounded-full" />
              )}
            </button>

            {/* City Filter (Desktop) */}
            <div className="hidden sm:block">
              <select
                value={currentCity}
                onChange={(e) => updateParams({ city: e.target.value || null })}
                className="px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Verified Filter (Desktop) */}
            <button
              onClick={() => updateParams({ verified: currentVerified ? null : 'true' })}
              className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                currentVerified
                  ? 'bg-(--brand-primary-light) border-(--brand-primary) text-(--brand-primary)'
                  : 'border-(--color-border) text-(--color-text-secondary) hover:bg-background'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Verified Only
            </button>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-(--color-text-disabled)" />
              <select
                value={currentSort}
                onChange={(e) => {
                  if (e.target.value === 'nearest' && userLat === null) {
                    requestLocation()
                    return
                  }
                  updateParams({ sort: e.target.value })
                }}
                className="px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="sm:hidden bg-(--color-surface) rounded-xl border border-(--color-border) p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5 text-(--color-text-disabled)" />
              </button>
            </div>

            <div className="space-y-4">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-(--color-text-secondary) mb-2">City</label>
                <select
                  value={currentCity}
                  onChange={(e) => updateParams({ city: e.target.value || null })}
                  className="w-full px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary)"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Verified Filter */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentVerified}
                    onChange={(e) => updateParams({ verified: e.target.checked ? 'true' : null })}
                    className="w-4 h-4 rounded border-(--color-border) text-(--brand-primary) focus:ring-(--brand-primary)"
                  />
                  <span className="text-(--color-text-secondary)">Verified stores only</span>
                </label>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => router.push('/stores')}
                className="mt-4 w-full py-2 text-center text-(--color-error) font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="hidden sm:flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm text-(--color-text-muted)">Active filters:</span>
            {currentSearch && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-(--brand-primary-light) text-(--brand-primary) rounded-full text-sm">
                Search: {currentSearch}
                <button onClick={() => { setSearchQuery(''); updateParams({ search: null }) }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {currentCity && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-(--brand-primary-light) text-(--brand-primary) rounded-full text-sm">
                {currentCity}
                <button onClick={() => updateParams({ city: null })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {currentVerified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-(--brand-primary-light) text-(--brand-primary) rounded-full text-sm">
                Verified
                <button onClick={() => updateParams({ verified: null })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => router.push('/stores')}
              className="text-sm text-(--color-error) hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden animate-pulse">
                <div className="h-32 bg-(--color-elevated)" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-(--color-elevated) rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-(--color-elevated) rounded w-3/4" />
                      <div className="h-4 bg-(--color-elevated) rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-12 bg-(--color-elevated) rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-(--color-surface) rounded-2xl border border-(--color-border) p-12 text-center">
            <Store className="w-16 h-16 text-(--color-text-disabled) mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No stores found</h2>
            <p className="text-(--color-text-muted) mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search criteria'
                : 'No stores are available at the moment'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => router.push('/stores')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Stores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/store/${store.slug}`}
                  className="group bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Banner */}
                  <div className="relative h-32 bg-(--brand-primary)">
                    {store.banner_url && (
                      <Image
                        src={store.banner_url}
                        alt={store.business_name}
                        fill
                        className="object-cover opacity-60"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 -mt-10 relative">
                      {/* Logo */}
                      <div className="w-14 h-14 rounded-xl bg-(--color-surface) border-2 border-(--color-surface) shadow-lg overflow-hidden shrink-0">
                        {store.logo_url ? (
                          <Image
                            src={store.logo_url}
                            alt={store.business_name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-(--brand-primary-light)">
                            <Store className="w-6 h-6 text-(--brand-primary)" />
                          </div>
                        )}
                      </div>

                      {/* Name & Verified */}
                      <div className="flex-1 min-w-0 pt-6">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-(--brand-primary) transition-colors">
                            {store.business_name}
                          </h3>
                          {store.is_verified && (
                            <CheckCircle className="w-4 h-4 text-(--brand-primary) shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {store.description && (
                      <p className="mt-3 text-sm text-(--color-text-muted) line-clamp-2">
                        {store.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      {store.rating > 0 && (
                        <div className="flex items-center gap-1 text-(--color-text-secondary)">
                          <Star className="w-4 h-4 text-(--brand-amber) fill-(--brand-amber)" />
                          <span className="font-medium">{store.rating.toFixed(1)}</span>
                          <span className="text-(--color-text-disabled)">({store.review_count})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-(--color-text-secondary)">
                        <Package className="w-4 h-4" />
                        <span>{store.product_count} products</span>
                      </div>
                      {store.distance_km !== null && store.distance_km !== undefined ? (
                        <div className="flex items-center gap-1 text-(--brand-primary) font-medium">
                          <Navigation className="w-4 h-4" />
                          <span>{store.distance_km} km</span>
                        </div>
                      ) : store.city ? (
                        <div className="flex items-center gap-1 text-(--color-text-secondary)">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{store.city}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => updateParams({ page: String(currentPage - 1) })}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (pagination.totalPages <= 7) return true
                      if (page === 1 || page === pagination.totalPages) return true
                      if (Math.abs(page - currentPage) <= 1) return true
                      return false
                    })
                    .map((page, i, arr) => {
                      // Add ellipsis
                      const showEllipsisBefore = i > 0 && page - arr[i - 1] > 1

                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="px-2 text-(--color-text-disabled)">...</span>
                          )}
                          <button
                            onClick={() => updateParams({ page: String(page) })}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              page === currentPage
                                ? 'bg-(--brand-primary) text-white'
                                : 'text-(--color-text-secondary) hover:bg-(--color-elevated)'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      )
                    })}
                </div>

                <button
                  onClick={() => updateParams({ page: String(currentPage + 1) })}
                  disabled={currentPage === pagination.totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StoresPageLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Store className="w-12 h-12 text-(--color-text-disabled) mx-auto mb-4 animate-pulse" />
        <p className="text-(--color-text-muted)">Loading stores...</p>
      </div>
    </div>
  )
}

export default function StoresPage() {
  return (
    <Suspense fallback={<StoresPageLoading />}>
      <StoresPageContent />
    </Suspense>
  )
}
