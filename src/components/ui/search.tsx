'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Loader2, Package, Mic, MicOff, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { useVoiceSearch } from '@/hooks/use-voice-search'

interface Product {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  category?: {
    name: string
  }
}

interface GlobalSearchProps {
  variant?: 'header' | 'page'
  placeholder?: string
}

const TRENDING_SEARCHES = [
  'Organic bananas', 'Free range eggs', 'Sourdough bread',
  'Oat milk', 'Avocados', 'Chicken breast', 'Fresh salmon',
]

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('recent-searches') || '[]').slice(0, 5)
  } catch { return [] }
}

function saveRecentSearch(term: string) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentSearches()
    const updated = [term, ...existing.filter(s => s.toLowerCase() !== term.toLowerCase())].slice(0, 5)
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  } catch { /* ignore */ }
}

export function GlobalSearch({ variant = 'header', placeholder = 'Search fresh produce, snacks, drinks...' }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setRecentSearches(getRecentSearches())
  }, [])

  const handleVoiceResult = useCallback((transcript: string) => {
    setQuery(transcript)
    setIsOpen(true)
    router.push(`/products?search=${encodeURIComponent(transcript)}`)
  }, [router])

  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoiceSearch(handleVoiceResult)

  // Only show voice button after hydration to prevent mismatch
  const showVoice = mounted && voiceSupported

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleProductClick = (slug: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/products/${slug}`)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      saveRecentSearch(query.trim())
      setRecentSearches(getRecentSearches())
      setIsOpen(false)
      router.push(`/products?search=${encodeURIComponent(query)}`)
    }
  }

  const handleQuickSearch = (term: string) => {
    setQuery(term)
    saveRecentSearch(term)
    setRecentSearches(getRecentSearches())
    setIsOpen(false)
    router.push(`/products?search=${encodeURIComponent(term)}`)
  }

  const clearRecentSearches = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('recent-searches')
    setRecentSearches([])
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center ${
          variant === 'header'
            ? 'rounded-lg border border-(--color-border) bg-(--color-elevated) transition-all duration-(--duration-fast) focus-within:bg-(--color-surface) focus-within:border-(--brand-primary) focus-within:shadow-[0_0_0_3px_rgba(27,107,58,0.1)]'
            : 'rounded-lg border border-(--color-border) bg-(--color-surface) shadow-(--shadow-sm)'
        }`}>
          <Search className="absolute left-3.5 w-[17px] h-[17px] text-(--color-text-muted) pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={isListening ? 'Listening...' : placeholder}
            className={`w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-(--color-text-muted) ${
              variant === 'header'
                ? 'pl-10 pr-16 py-2.5 w-full'
                : 'pl-10 pr-16 py-3 w-full'
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResults([])
              }}
              className="absolute right-10 p-1 text-(--color-text-muted) hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {/* Voice search button — renders only after hydration */}
          {showVoice && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`absolute right-3 md:right-12 p-1.5 rounded-full transition-colors ${
                isListening
                  ? 'text-white bg-(--color-error) animate-pulse'
                  : 'text-(--color-text-muted) hover:text-(--brand-primary) hover:bg-(--color-elevated)'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Voice search'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <kbd className="absolute right-3 hidden md:inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-(--color-text-muted) bg-(--color-surface) rounded-sm border border-(--color-border)">
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-xl) overflow-hidden z-[var(--z-dropdown)]">
          {/* Empty state: show trending + recent searches */}
          {query.length < 2 && results.length === 0 && (
            <div className="py-3">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Recent
                    </p>
                    <button onClick={clearRecentSearches} className="text-xs text-(--color-text-muted) hover:text-(--brand-primary) transition-colors">
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSearch(term)}
                        className="px-3 py-1.5 text-sm bg-(--color-elevated) hover:bg-(--brand-primary-light) hover:text-(--brand-primary) rounded-full transition-colors text-(--color-text-secondary)"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div className="px-4 pt-1">
                {recentSearches.length > 0 && <div className="border-t border-(--color-border) mb-3" />}
                <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" /> Trending
                </p>
                <div className="space-y-0.5">
                  {TRENDING_SEARCHES.slice(0, 5).map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickSearch(term)}
                      className="w-full flex items-center gap-3 px-2 py-2 hover:bg-(--color-elevated) rounded-lg transition-colors text-left"
                    >
                      <Search className="h-3.5 w-3.5 text-(--color-text-disabled)" />
                      <span className="text-sm text-(--color-text-secondary)">{term}</span>
                      <ArrowRight className="h-3 w-3 text-(--color-text-disabled) ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {query.length >= 2 && loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-(--brand-primary)" />
            </div>
          ) : results.length > 0 ? (
            <>
              <ul className="max-h-80 overflow-y-auto">
                {results.map((product) => (
                  <li key={product.id}>
                    <button
                      onClick={() => handleProductClick(product.slug)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-(--color-elevated) transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-(--color-elevated) shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-(--color-text-disabled)">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        {product.category && (
                          <p className="text-xs text-(--color-text-muted)">{product.category.name}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold font-mono text-foreground">
                        {formatPrice(product.price_pence)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-(--color-border) px-4 py-2.5">
                <button
                  onClick={handleSubmit}
                  className="text-sm font-medium text-(--brand-primary) hover:underline"
                >
                  See all results for &ldquo;{query}&rdquo; →
                </button>
              </div>
            </>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center">
              <Package className="w-10 h-10 text-(--color-text-disabled) mx-auto mb-2" />
              <p className="text-sm text-(--color-text-muted)">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
