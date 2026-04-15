'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface SortOption {
  value: string
  label: string
}

interface SortSelectProps {
  options: SortOption[]
  currentSort: string
}

export function SortSelect({ options, currentSort }: SortSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      defaultValue={currentSort}
      className="text-sm border border-(--color-border) rounded-lg px-3 py-2 focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
      onChange={handleChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
