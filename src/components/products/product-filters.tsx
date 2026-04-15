'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Suspense, useState, useCallback } from 'react'
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Leaf,
  Heart,
  Wheat,
  Sparkles,
  Filter,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  { value: 'featured', label: 'Featured', icon: Sparkles },
  { value: 'name', label: 'Name A-Z', icon: ArrowUpDown },
  { value: 'price_asc', label: 'Price: Low to High', icon: ArrowUpDown },
  { value: 'price_desc', label: 'Price: High to Low', icon: ArrowUpDown },
  { value: 'newest', label: 'Newest First', icon: Sparkles },
]

const dietaryFilters = [
  { key: 'vegan', label: 'Vegan', icon: Leaf, color: 'emerald', description: 'Plant-based products' },
  { key: 'vegetarian', label: 'Vegetarian', icon: Heart, color: 'green', description: 'No meat products' },
  { key: 'gluten_free', label: 'Gluten Free', icon: Wheat, color: 'amber', description: 'Wheat-free options' },
  { key: 'organic', label: 'Organic', icon: Sparkles, color: 'lime', description: 'Certified organic' },
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

  const activeFilterCount = [
    searchParams.has('search'),
    searchParams.has('vegan'),
    searchParams.has('vegetarian'),
    searchParams.has('gluten_free'),
    searchParams.has('organic'),
  ].filter(Boolean).length

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <Card className="border-(--color-border) shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-(--brand-primary)" />
            Search Products
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-disabled) hover:text-(--color-text-secondary)"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="icon" className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sort */}
      <Card className="border-(--color-border) shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-(--brand-primary)" />
            Sort By
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Select
            value={searchParams.get('sort') || 'featured'}
            onValueChange={handleSort}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4 text-(--color-text-disabled)" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dietary Filters */}
      <Card className="border-(--color-border) shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-(--brand-primary)" />
            Dietary Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {dietaryFilters.map((filter) => {
              const isActive = searchParams.get(filter.key) === 'true'
              const Icon = filter.icon
              return (
                <button
                  key={filter.key}
                  onClick={() => handleDietaryFilter(filter.key, !isActive)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? 'border-(--brand-primary) bg-(--brand-primary-light)'
                      : 'border-(--color-border) bg-background hover:border-(--color-border) hover:bg-(--color-elevated)'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-(--brand-primary) text-white' : 'bg-(--color-surface) text-(--color-text-disabled)'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isActive ? 'text-(--brand-primary)' : 'text-(--color-text-secondary)'}`}>
                      {filter.label}
                    </p>
                    <p className="text-xs text-(--color-text-muted)">{filter.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isActive
                      ? 'border-(--brand-primary) bg-(--brand-primary)'
                      : 'border-(--color-border)'
                  }`}>
                    {isActive && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full border-(--color-error) text-(--color-error) hover:bg-(--color-error)/5 hover:text-(--color-error)"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-(--brand-primary)" />
            Filters
          </h2>
          {activeFilterCount > 0 && (
            <Badge className="bg-(--brand-primary-light) text-(--brand-primary)">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <FiltersContent />
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Card className="border-(--color-border) shadow-sm mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
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
                  <Button variant="outline" className="shrink-0 relative">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-(--brand-primary)">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-(--brand-primary)" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge className="bg-(--brand-primary-light) text-(--brand-primary)">
                          {activeFilterCount} active
                        </Badge>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <FiltersContent />
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function FiltersSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-(--color-border)">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card className="border-(--color-border)">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card className="border-(--color-border)">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
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
