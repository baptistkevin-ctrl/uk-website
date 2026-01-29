'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface NoResultsProps {
  className?: string
  query?: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  onClearSearch?: () => void
}

export function NoResults({
  className,
  query,
  suggestions = ['Milk', 'Bread', 'Eggs', 'Fruits', 'Vegetables'],
  onSuggestionClick,
  onClearSearch
}: NoResultsProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-16',
        'bg-gradient-to-b from-yellow-50/30 via-amber-50/20 to-white',
        'rounded-xl border border-gray-100',
        className
      )}
    >
      {/* Animated Search Illustration */}
      <div className="relative mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-yellow-100/40 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Main illustration */}
        <div className="relative z-10">
          <svg
            className="w-40 h-40"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Magnifying glass */}
            <g className="animate-[searchWiggle_2s_ease-in-out_infinite]" style={{ transformOrigin: '70px 70px' }}>
              {/* Glass circle */}
              <circle
                cx="65"
                cy="65"
                r="38"
                className="fill-yellow-50 stroke-gray-300"
                strokeWidth="5"
              />
              {/* Inner circle highlight */}
              <circle
                cx="65"
                cy="65"
                r="30"
                className="stroke-yellow-200"
                strokeWidth="2"
                strokeDasharray="8 8"
                fill="none"
              />
              {/* Handle */}
              <line
                x1="93"
                y1="93"
                x2="125"
                y2="125"
                className="stroke-gray-400"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <line
                x1="95"
                y1="95"
                x2="120"
                y2="120"
                className="stroke-gray-300"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>

            {/* Question marks inside glass */}
            <g className="animate-[fadeQuestion_2s_ease-in-out_infinite]">
              <text x="50" y="60" className="fill-gray-300 text-xl" fontFamily="sans-serif" fontWeight="bold">?</text>
              <text x="70" y="75" className="fill-gray-200 text-lg" fontFamily="sans-serif" fontWeight="bold">?</text>
            </g>

            {/* Flying search items */}
            <g className="animate-[itemFly_3s_ease-in-out_infinite]">
              <circle cx="25" cy="45" r="8" className="fill-amber-200 stroke-amber-300" strokeWidth="1.5" />
              <path d="M22 45 L28 45" className="stroke-amber-400" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            <g className="animate-[itemFly_3s_ease-in-out_infinite_0.5s]">
              <circle cx="135" cy="55" r="6" className="fill-yellow-200 stroke-yellow-300" strokeWidth="1.5" />
              <path d="M133 55 L137 55" className="stroke-yellow-400" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            <g className="animate-[itemFly_3s_ease-in-out_infinite_1s]">
              <circle cx="30" cy="100" r="5" className="fill-orange-200 stroke-orange-300" strokeWidth="1.5" />
            </g>
            <g className="animate-[itemFly_3s_ease-in-out_infinite_1.5s]">
              <circle cx="140" cy="95" r="7" className="fill-amber-100 stroke-amber-200" strokeWidth="1.5" />
            </g>

            {/* Sparkles */}
            <path
              d="M15 25L17 30L22 32L17 34L15 39L13 34L8 32L13 30L15 25Z"
              className="fill-yellow-400 animate-[twinkle_2s_ease-in-out_infinite]"
            />
            <path
              d="M145 30L146.5 34L151 35.5L146.5 37L145 41L143.5 37L139 35.5L143.5 34L145 30Z"
              className="fill-amber-300 animate-[twinkle_2s_ease-in-out_infinite_0.7s]"
            />
            <path
              d="M120 140L121 143L124 144L121 145L120 148L119 145L116 144L119 143L120 140Z"
              className="fill-yellow-300 animate-[twinkle_2s_ease-in-out_infinite_1.2s]"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-bold text-gray-900">
          No results found
        </h3>
        <p className="text-gray-500 leading-relaxed">
          {query ? (
            <>We couldn&apos;t find anything matching &quot;<span className="font-medium text-gray-700">{query}</span>&quot;. Try checking your spelling or using different keywords.</>
          ) : (
            <>We couldn&apos;t find what you&apos;re looking for. Try adjusting your search or browse our categories.</>
          )}
        </p>
      </div>

      {/* Search suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-6 max-w-md">
          <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full hover:bg-yellow-50 hover:border-yellow-300 transition-colors text-gray-600 hover:text-gray-900"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 bg-amber-50/50 rounded-lg p-4 max-w-sm">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-amber-700">Tip:</span> Use simple terms like &quot;apples&quot; or &quot;pasta&quot; for better results.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {onClearSearch && (
          <Button onClick={onClearSearch} size="lg" variant="outline" className="gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Search
          </Button>
        )}
        <Button asChild size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Link href="/products">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Browse All Products
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/categories">View Categories</Link>
        </Button>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes searchWiggle {
          0%, 100% { transform: rotate(-3deg) scale(1); }
          25% { transform: rotate(2deg) scale(1.02); }
          50% { transform: rotate(-2deg) scale(1); }
          75% { transform: rotate(3deg) scale(1.01); }
        }
        @keyframes fadeQuestion {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes itemFly {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-12px) rotate(10deg); opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
