'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Scale, ArrowRight, Package } from 'lucide-react'
import { useCompareStore } from '@/stores/compare-store'

export default function CompareBar() {
  const { products, removeProduct, clearAll, maxProducts } = useCompareStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || products.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40 animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Label */}
          <div className="flex items-center gap-2 text-slate-700">
            <Scale className="w-5 h-5 text-emerald-600" />
            <span className="font-medium hidden sm:inline">Compare</span>
            <span className="text-sm text-slate-500">
              ({products.length}/{maxProducts})
            </span>
          </div>

          {/* Products */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative flex-shrink-0 group"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="block w-12 h-12 rounded-lg bg-slate-100 overflow-hidden"
                >
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: maxProducts - products.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-200 flex-shrink-0"
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              Clear
            </button>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <span className="hidden sm:inline">Compare Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
