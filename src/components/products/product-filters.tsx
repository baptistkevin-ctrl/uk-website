'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Suspense, useState, useCallback } from 'react'
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
]

const dietaryFilters = [
  { key: 'vegan', label: 'Vegan' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'gluten_free', label: 'Gluten Free' },
  { key: 'organic', label: 'Organic' },
]

function ProductFiltersContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [mobileOpen, setMobileOpen] = useState(false)

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key)
        } else {
          newParams.set(key, value)
        }
      })

      return newParams.toString()
    },
    [searchParams]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const queryString = createQueryString({
      search: search || null,
    })
    router.push(`${pathname}?${queryString}`)
  }

  const handleSort = (value: string) => {
    const queryString = createQueryString({
      sort: value === 'featured' ? null : value,
    })
    router.push(`${pathname}?${queryString}`)
  }

  const handleDietaryFilter = (key: string, checked: boolean) => {
    const queryString = createQueryString({
      [key]: checked ? 'true' : null,
    })
    router.push(`${pathname}?${queryString}`)
  }

  const clearFilters = () => {
    router.push(pathname)
    setSearch('')
  }

  const hasActiveFilters =
    searchParams.has('search') ||
    searchParams.has('vegan') ||
    searchParams.has('vegetarian') ||
    searchParams.has('gluten_free') ||
    searchParams.has('organic') ||
    searchParams.has('sort')

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Search</Label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Separator />

      {/* Sort */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Sort By</Label>
        <Select
          value={searchParams.get('sort') || 'featured'}
          onValueChange={handleSort}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Dietary Filters */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Dietary</Label>
        <div className="space-y-2">
          {dietaryFilters.map((filter) => (
            <label
              key={filter.key}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={searchParams.get(filter.key) === 'true'}
                onChange={(e) =>
                  handleDietaryFilter(filter.key, e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">{filter.label}</span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block sticky top-24">
        <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>
        <FiltersContent />
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden flex items-center gap-4 mb-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

function FiltersSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Separator />
      <div>
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Separator />
      <div>
        <Skeleton className="h-4 w-16 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-24" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductFilters() {
  return (
    <Suspense fallback={<FiltersSkeleton />}>
      <ProductFiltersContent />
    </Suspense>
  )
}
