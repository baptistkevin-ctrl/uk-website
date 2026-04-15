'use client'

import { useState, useRef, useCallback, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchSuggestion {
  id: string
  name: string
  category: string
  price: number
  image: string
}

interface SearchBarProps {
  className?: string
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const debouncedQuery = useDebounce(query, 280)

  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      return
    }

    setLoading(true)
    setError(false)

    try {
      const res = await fetch(
        `/api/search/suggest?q=${encodeURIComponent(searchTerm.trim())}`
      )

      if (!res.ok) throw new Error('Search failed')

      const data: SearchSuggestion[] = await res.json()
      setSuggestions(data)
    } catch {
      setError(true)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const prevQueryRef = useRef('')
  if (debouncedQuery !== prevQueryRef.current) {
    prevQueryRef.current = debouncedQuery
    fetchSuggestions(debouncedQuery)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150)
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  const showDropdown = open && query.length > 0

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder="Search fresh produce, snacks, drinks..."
          className={cn(
            'h-10 w-full rounded-lg border border-(--color-border) bg-(--color-elevated) pl-9 pr-9 text-sm text-foreground placeholder:text-(--color-text-muted) outline-none transition-all duration-(--duration-fast)',
            'focus:border-(--brand-primary) focus:bg-(--color-surface) focus:ring-2 focus:ring-(--brand-primary)/30'
          )}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) transition-colors duration-(--duration-fast) hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full z-(--z-dropdown) mt-1.5 w-full overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-xl)">
          {loading && (
            <div className="space-y-1 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-3 rounded-lg px-4 py-3"
                >
                  <div className="h-10 w-10 rounded bg-(--color-elevated)" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-(--color-elevated)" />
                    <div className="h-3 w-1/3 rounded bg-(--color-elevated)" />
                  </div>
                  <div className="h-4 w-12 rounded bg-(--color-elevated)" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-(--color-text-muted)">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-8 text-center text-sm text-(--color-text-muted)">
              Something went wrong. Try again.
            </div>
          )}

          {!loading && !error && suggestions.length > 0 && (
            <>
              <ul role="listbox">
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onMouseDown={() =>
                        router.push(`/search?q=${encodeURIComponent(item.name)}`)
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-(--duration-fast) hover:bg-(--color-elevated)"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-(--color-text-muted)">
                          {item.category}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-semibold text-foreground">
                        £{item.price.toFixed(2)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="border-t border-(--color-border)">
                <button
                  type="button"
                  onMouseDown={() =>
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
                  }
                  className="w-full px-4 py-3 text-center text-sm font-medium text-(--brand-primary) transition-colors duration-(--duration-fast) hover:bg-(--color-elevated)"
                >
                  See all results for &ldquo;{query}&rdquo; &rarr;
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </form>
  )
}
