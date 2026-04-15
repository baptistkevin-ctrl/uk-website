'use client'

import { useState, useEffect } from 'react'
import { Scale, Check } from 'lucide-react'
import { useCompareStore } from '@/stores/compare-store'

interface CompareButtonProps {
  product: {
    id: string
    name: string
    slug: string
    image_url: string | null
    price_pence: number
    compare_at_price_pence: number | null
    brand: string | null
    unit: string
    unit_value: number | null
    is_organic: boolean
    is_vegan: boolean
    is_vegetarian: boolean
    is_gluten_free: boolean
    avg_rating: number
    review_count: number
    short_description: string | null
    stock_quantity: number
    vendor?: {
      business_name: string
      slug: string
    } | null
  }
  variant?: 'icon' | 'button'
  className?: string
}

export default function CompareButton({ product, variant = 'icon', className = '' }: CompareButtonProps) {
  const { addProduct, removeProduct, isInCompare, canAdd } = useCompareStore()
  const [mounted, setMounted] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const inCompare = isInCompare(product.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inCompare) {
      removeProduct(product.id)
      setToastMessage('Removed from compare')
    } else {
      if (!canAdd()) {
        setToastMessage('Compare list is full (max 4)')
      } else {
        addProduct(product)
        setToastMessage('Added to compare')
      }
    }

    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  if (variant === 'button') {
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            inCompare
              ? 'bg-(--brand-primary-light) text-(--brand-primary) hover:bg-(--brand-primary-light)'
              : 'bg-background text-foreground hover:bg-(--color-elevated)'
          } ${className}`}
        >
          {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
          {inCompare ? 'In Compare' : 'Compare'}
        </button>

        {/* Toast */}
        {showToast && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-(--color-elevated) text-foreground text-sm rounded-lg whitespace-nowrap animate-fade-in">
            {toastMessage}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`p-2 rounded-lg transition-colors ${
          inCompare
            ? 'bg-(--brand-primary-light) text-(--brand-primary)'
            : 'bg-(--color-surface)/80 hover:bg-(--color-surface) text-(--color-text-secondary) hover:text-(--brand-primary)'
        } ${className}`}
        title={inCompare ? 'Remove from compare' : 'Add to compare'}
      >
        {inCompare ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
      </button>

      {/* Toast */}
      {showToast && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-(--color-elevated) text-foreground text-sm rounded-lg whitespace-nowrap animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
