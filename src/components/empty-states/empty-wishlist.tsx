'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface EmptyWishlistProps {
  className?: string
  onExploreClick?: () => void
}

export function EmptyWishlist({ className, onExploreClick }: EmptyWishlistProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-16',
        'bg-gradient-to-b from-pink-50/30 via-rose-50/20 to-white',
        'rounded-xl border border-gray-100',
        className
      )}
    >
      {/* Animated Heart Illustration */}
      <div className="relative mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-pink-100/40 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Main illustration */}
        <div className="relative z-10">
          <svg
            className="w-40 h-40"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Main heart - beating animation */}
            <g className="animate-[heartbeat_1.5s_ease-in-out_infinite]" style={{ transformOrigin: '80px 75px' }}>
              <path
                d="M80 130C80 130 24 90 24 52C24 28 44 12 64 12C76 12 78 20 80 24C82 20 84 12 96 12C116 12 136 28 136 52C136 90 80 130 80 130Z"
                className="stroke-pink-300 fill-pink-50"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Inner heart highlight */}
              <path
                d="M80 115C80 115 40 85 40 55C40 38 54 26 68 26"
                className="stroke-pink-200"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="6 4"
                fill="none"
              />
            </g>

            {/* Floating hearts */}
            <g className="animate-[floatUp_3s_ease-in-out_infinite]">
              <path
                d="M30 60C30 60 24 54 24 48C24 42 27 39 30 39C32 39 33 40 34 42C35 40 36 39 38 39C41 39 44 42 44 48C44 54 38 60 38 60"
                className="fill-pink-200 stroke-pink-300"
                strokeWidth="1"
              />
            </g>
            <g className="animate-[floatUp_3s_ease-in-out_infinite_0.5s]">
              <path
                d="M130 45C130 45 126 41 126 37C126 33 128 31 130 31C131 31 132 32 132 33C133 32 134 31 135 31C137 31 139 33 139 37C139 41 135 45 135 45"
                className="fill-rose-200 stroke-rose-300"
                strokeWidth="1"
              />
            </g>
            <g className="animate-[floatUp_3s_ease-in-out_infinite_1s]">
              <path
                d="M140 85C140 85 137 82 137 79C137 76 139 74 140 74C141 74 142 75 142 76C143 75 143 74 145 74C146 74 148 76 148 79C148 82 145 85 145 85"
                className="fill-pink-300 stroke-pink-400"
                strokeWidth="1"
              />
            </g>

            {/* Sparkle stars */}
            <path
              d="M20 35L22 40L27 42L22 44L20 49L18 44L13 42L18 40L20 35Z"
              className="fill-pink-400 animate-[twinkle_2s_ease-in-out_infinite]"
            />
            <path
              d="M145 25L146.5 29L151 30.5L146.5 32L145 36L143.5 32L139 30.5L143.5 29L145 25Z"
              className="fill-rose-300 animate-[twinkle_2s_ease-in-out_infinite_0.7s]"
            />
            <path
              d="M25 100L26 103L29 104L26 105L25 108L24 105L21 104L24 103L25 100Z"
              className="fill-pink-300 animate-[twinkle_2s_ease-in-out_infinite_1.2s]"
            />

            {/* Empty indicator dots inside heart */}
            <circle cx="65" cy="60" r="3" className="fill-gray-200" />
            <circle cx="80" cy="55" r="3" className="fill-gray-200" />
            <circle cx="95" cy="60" r="3" className="fill-gray-200" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-bold text-gray-900">
          Your wishlist is empty
        </h3>
        <p className="text-gray-500 leading-relaxed">
          Save your favourite products here and never lose track of items you love.
          Heart the products you want to remember!
        </p>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-pink-50/50 rounded-lg p-4 max-w-sm">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-pink-600">Tip:</span> Click the heart icon on any product to add it to your wishlist for easy access later.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="gap-2 bg-pink-600 hover:bg-pink-700">
          <Link href="/products">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Discover Products
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/deals">Check Out Deals</Link>
        </Button>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.05); }
          50% { transform: scale(1); }
          75% { transform: scale(1.03); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-10px) rotate(5deg); opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
