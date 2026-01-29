'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface EmptyCartProps {
  className?: string
  onBrowseClick?: () => void
}

export function EmptyCart({ className, onBrowseClick }: EmptyCartProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-16',
        'bg-gradient-to-b from-green-50/30 via-white to-white',
        'rounded-xl border border-gray-100',
        className
      )}
    >
      {/* Animated Cart Illustration */}
      <div className="relative mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-green-100/40 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Main illustration */}
        <div className="relative z-10">
          <svg
            className="w-40 h-40"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Shopping cart */}
            <g className="animate-[wiggle_2s_ease-in-out_infinite]" style={{ transformOrigin: 'center' }}>
              {/* Cart body */}
              <path
                d="M32 36H44L60 100H120L136 52H56"
                className="stroke-gray-300"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Cart basket */}
              <path
                d="M60 100H120L136 52H56L60 100Z"
                className="fill-green-50 stroke-gray-300"
                strokeWidth="3"
              />
            </g>

            {/* Wheels */}
            <g className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: '72px 118px' }}>
              <circle cx="72" cy="118" r="10" className="stroke-gray-400 fill-white" strokeWidth="4" />
              <circle cx="72" cy="118" r="3" className="fill-gray-300" />
            </g>
            <g className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: '108px 118px' }}>
              <circle cx="108" cy="118" r="10" className="stroke-gray-400 fill-white" strokeWidth="4" />
              <circle cx="108" cy="118" r="3" className="fill-gray-300" />
            </g>

            {/* Empty indicator - dashed circle inside cart */}
            <circle
              cx="90"
              cy="72"
              r="18"
              className="stroke-gray-200"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />

            {/* Floating grocery items - flying away effect */}
            <g className="animate-[float_3s_ease-in-out_infinite]">
              <circle cx="140" cy="30" r="6" className="fill-green-200" />
              <circle cx="140" cy="30" r="3" className="fill-green-400" />
            </g>
            <g className="animate-[float_3s_ease-in-out_infinite_0.5s]">
              <circle cx="28" cy="60" r="5" className="fill-orange-200" />
              <circle cx="28" cy="60" r="2" className="fill-orange-400" />
            </g>
            <g className="animate-[float_3s_ease-in-out_infinite_1s]">
              <circle cx="145" cy="85" r="4" className="fill-yellow-200" />
              <circle cx="145" cy="85" r="2" className="fill-yellow-400" />
            </g>

            {/* Sparkles */}
            <path
              d="M20 25L22 30L27 32L22 34L20 39L18 34L13 32L18 30L20 25Z"
              className="fill-green-300 animate-[twinkle_2s_ease-in-out_infinite]"
            />
            <path
              d="M150 55L151.5 59L156 60.5L151.5 62L150 66L148.5 62L144 60.5L148.5 59L150 55Z"
              className="fill-green-200 animate-[twinkle_2s_ease-in-out_infinite_0.5s]"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-bold text-gray-900">
          Your cart is empty
        </h3>
        <p className="text-gray-500 leading-relaxed">
          Looks like you haven&apos;t added any groceries yet.
          Start exploring our fresh produce and great deals!
        </p>
      </div>

      {/* Benefits reminder */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Free delivery over 40
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Fresh guarantee
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Easy returns
        </span>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="gap-2">
          <Link href="/products">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8l-1.6 8h11.2M9 21a1 1 0 11-2 0 1 1 0 012 0zm10 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            Start Shopping
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/deals">View Today&apos;s Deals</Link>
        </Button>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-8px) scale(1.1); opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
