'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function SortDropdown() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'name'

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'name') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <select
      value={currentSort}
      onChange={(e) => handleSort(e.target.value)}
      className="text-sm bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2.5 text-(--color-text-secondary) focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30"
    >
      <option value="name">Sort by: Name</option>
      <option value="price-low">Price: Low to High</option>
      <option value="price-high">Price: High to Low</option>
      <option value="newest">Newest First</option>
      <option value="popular">Most Popular</option>
    </select>
  )
}
