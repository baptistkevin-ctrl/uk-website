'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Loader2, Package, ShoppingCart, Users, FileText } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface SearchResult {
  type: 'product' | 'order' | 'category'
  id: string
  title: string
  subtitle?: string
  image?: string | null
  href: string
}

export function AdminSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const searchResults: SearchResult[] = []

      try {
        // Search products
        const productsRes = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=4&includeInactive=true`)
        const products = await productsRes.json()
        if (Array.isArray(products)) {
          products.forEach((p: any) => {
            searchResults.push({
              type: 'product',
              id: p.id,
              title: p.name,
              subtitle: `${formatPrice(p.price_pence)} - ${p.is_active ? 'Active' : 'Inactive'}`,
              image: p.image_url,
              href: `/admin/products/${p.id}/edit`,
            })
          })
        }

        // Search orders by order number
        if (query.match(/^[A-Z0-9-]+$/i)) {
          const ordersRes = await fetch(`/api/admin/orders?search=${encodeURIComponent(query)}&limit=3`)
          const ordersData = await ordersRes.json()
          if (ordersData.orders && Array.isArray(ordersData.orders)) {
            ordersData.orders.forEach((o: any) => {
              searchResults.push({
                type: 'order',
                id: o.id,
                title: `Order #${o.order_number}`,
                subtitle: `${o.status} - ${formatPrice(o.total)}`,
                href: `/admin/orders/${o.id}`,
              })
            })
          }
        }

        setResults(searchResults)
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

  const handleResultClick = (href: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(href)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4" />
      case 'order':
        return <ShoppingCart className="w-4 h-4" />
      case 'category':
        return <FileText className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 bg-(--color-elevated) rounded-xl px-4 py-2.5 w-80">
        <Search className="w-5 h-5 text-(--color-text-disabled)" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, orders..."
          className="bg-transparent border-none outline-none text-sm text-(--color-text-secondary) placeholder:text-(--color-text-disabled) w-full"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="p-1 text-(--color-text-disabled) hover:text-(--color-text-secondary)"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <kbd className="hidden md:inline-flex items-center px-2 py-0.5 text-xs font-medium text-(--color-text-disabled) bg-(--color-surface) rounded border border-(--color-border)">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-(--color-surface) rounded-xl shadow-xl border border-(--color-border) overflow-hidden z-50 min-w-[320px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-(--brand-primary)" />
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto divide-y divide-(--color-border)">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => handleResultClick(result.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                  >
                    {result.image ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-(--color-elevated) shrink-0">
                        <Image
                          src={result.image}
                          alt={result.title}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-(--color-elevated) flex items-center justify-center shrink-0 text-(--color-text-disabled)">
                        {getIcon(result.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-(--color-text-muted)">{result.subtitle}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      result.type === 'product' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                      result.type === 'order' ? 'bg-blue-100 text-blue-700' :
                      'bg-(--color-elevated) text-foreground'
                    }`}>
                      {result.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center">
              <Search className="w-10 h-10 text-(--color-text-disabled) mx-auto mb-2" />
              <p className="text-(--color-text-muted)">No results found for "{query}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
