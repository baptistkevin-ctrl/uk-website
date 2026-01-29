'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface EmptyOrdersProps {
  className?: string
  variant?: 'default' | 'minimal'
}

export function EmptyOrders({ className, variant = 'default' }: EmptyOrdersProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-16',
        'bg-gradient-to-b from-blue-50/30 via-indigo-50/20 to-white',
        'rounded-xl border border-gray-100',
        className
      )}
    >
      {/* Animated Receipt/Order Illustration */}
      <div className="relative mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-blue-100/40 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Main illustration */}
        <div className="relative z-10">
          <svg
            className="w-40 h-40"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Main receipt/clipboard */}
            <g className="animate-[paperFloat_3s_ease-in-out_infinite]" style={{ transformOrigin: 'center' }}>
              {/* Receipt body */}
              <rect
                x="40"
                y="24"
                width="80"
                height="112"
                rx="6"
                className="fill-white stroke-gray-300"
                strokeWidth="3"
              />

              {/* Receipt zigzag bottom */}
              <path
                d="M40 130L48 136L56 130L64 136L72 130L80 136L88 130L96 136L104 130L112 136L120 130"
                className="stroke-gray-300"
                strokeWidth="2"
                fill="none"
              />

              {/* Clipboard top clip */}
              <rect
                x="58"
                y="16"
                width="44"
                height="16"
                rx="4"
                className="fill-blue-100 stroke-blue-300"
                strokeWidth="2"
              />
              <circle cx="80" cy="24" r="4" className="fill-blue-300" />

              {/* Empty order lines - dashed to show emptiness */}
              <line
                x1="54"
                y1="55"
                x2="106"
                y2="55"
                className="stroke-gray-200"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 4"
              />
              <line
                x1="54"
                y1="72"
                x2="96"
                y2="72"
                className="stroke-gray-200"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 4"
              />
              <line
                x1="54"
                y1="89"
                x2="86"
                y2="89"
                className="stroke-gray-200"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 4"
              />
              <line
                x1="54"
                y1="106"
                x2="76"
                y2="106"
                className="stroke-gray-200"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 4"
              />
            </g>

            {/* Floating package boxes */}
            <g className="animate-[boxFloat_4s_ease-in-out_infinite]">
              <rect
                x="15"
                y="55"
                width="18"
                height="18"
                rx="2"
                className="fill-blue-100 stroke-blue-300"
                strokeWidth="2"
              />
              <line x1="15" y1="64" x2="33" y2="64" className="stroke-blue-300" strokeWidth="1.5" />
              <line x1="24" y1="55" x2="24" y2="64" className="stroke-blue-300" strokeWidth="1.5" />
            </g>
            <g className="animate-[boxFloat_4s_ease-in-out_infinite_1s]">
              <rect
                x="130"
                y="70"
                width="14"
                height="14"
                rx="2"
                className="fill-indigo-100 stroke-indigo-300"
                strokeWidth="2"
              />
              <line x1="130" y1="77" x2="144" y2="77" className="stroke-indigo-300" strokeWidth="1.5" />
              <line x1="137" y1="70" x2="137" y2="77" className="stroke-indigo-300" strokeWidth="1.5" />
            </g>

            {/* Delivery truck */}
            <g className="animate-[truckDrive_5s_ease-in-out_infinite]" style={{ transformOrigin: 'center' }}>
              <rect x="125" y="115" width="22" height="14" rx="2" className="fill-blue-200 stroke-blue-400" strokeWidth="1.5" />
              <rect x="135" y="108" width="12" height="7" rx="1" className="fill-blue-300 stroke-blue-400" strokeWidth="1" />
              <circle cx="130" cy="132" r="4" className="fill-gray-400 stroke-gray-500" strokeWidth="1.5" />
              <circle cx="142" cy="132" r="4" className="fill-gray-400 stroke-gray-500" strokeWidth="1.5" />
            </g>

            {/* Sparkles */}
            <path
              d="M20 30L22 35L27 37L22 39L20 44L18 39L13 37L18 35L20 30Z"
              className="fill-blue-400 animate-[twinkle_2s_ease-in-out_infinite]"
            />
            <path
              d="M140 40L141.5 44L146 45.5L141.5 47L140 51L138.5 47L134 45.5L138.5 44L140 40Z"
              className="fill-indigo-300 animate-[twinkle_2s_ease-in-out_infinite_0.7s]"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-bold text-gray-900">
          No orders yet
        </h3>
        <p className="text-gray-500 leading-relaxed">
          When you place an order, it will appear here. Track deliveries, reorder favourites, and view your order history all in one place.
        </p>
      </div>

      {/* Order benefits */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
        <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-100">
          <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-gray-600 font-medium">Quick Delivery</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-100">
          <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs text-gray-600 font-medium">Easy Reorders</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-100">
          <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-gray-600 font-medium">Order Tracking</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Link href="/products">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Start Shopping
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/deals">Browse Deals</Link>
        </Button>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes paperFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
        @keyframes boxFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-8px) scale(1.05); opacity: 1; }
        }
        @keyframes truckDrive {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-5px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
