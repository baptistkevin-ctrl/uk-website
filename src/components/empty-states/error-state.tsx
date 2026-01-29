'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  className?: string
  title?: string
  message?: string
  errorCode?: string | number
  onRetry?: () => void
  showHomeButton?: boolean
  showContactSupport?: boolean
}

export function ErrorState({
  className,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again or contact support if the problem persists.',
  errorCode,
  onRetry,
  showHomeButton = true,
  showContactSupport = true
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-16',
        'bg-gradient-to-b from-red-50/30 via-rose-50/20 to-white',
        'rounded-xl border border-gray-100',
        className
      )}
    >
      {/* Animated Error Illustration */}
      <div className="relative mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-red-100/40 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Main illustration */}
        <div className="relative z-10">
          <svg
            className="w-40 h-40"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Warning triangle */}
            <g className="animate-[triangleShake_2s_ease-in-out_infinite]" style={{ transformOrigin: '80px 85px' }}>
              {/* Triangle body */}
              <path
                d="M80 30L130 115H30L80 30Z"
                className="fill-red-50 stroke-red-300"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Inner highlight */}
              <path
                d="M80 45L115 105H45L80 45Z"
                className="stroke-red-200"
                strokeWidth="2"
                strokeDasharray="6 4"
                fill="none"
              />

              {/* Exclamation mark */}
              <line
                x1="80"
                y1="58"
                x2="80"
                y2="82"
                className="stroke-red-400"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="80" cy="96" r="4" className="fill-red-400" />
            </g>

            {/* Broken pieces flying off */}
            <g className="animate-[pieceFly_2.5s_ease-in-out_infinite]">
              <rect x="20" y="40" width="10" height="10" rx="2" className="fill-red-200" transform="rotate(15 25 45)" />
            </g>
            <g className="animate-[pieceFly_2.5s_ease-in-out_infinite_0.3s]">
              <rect x="130" y="45" width="8" height="8" rx="1" className="fill-rose-200" transform="rotate(-20 134 49)" />
            </g>
            <g className="animate-[pieceFly_2.5s_ease-in-out_infinite_0.6s]">
              <rect x="25" y="100" width="7" height="7" rx="1" className="fill-red-100" transform="rotate(25 28 103)" />
            </g>
            <g className="animate-[pieceFly_2.5s_ease-in-out_infinite_0.9s]">
              <rect x="128" y="90" width="9" height="9" rx="1" className="fill-rose-100" transform="rotate(-15 132 94)" />
            </g>

            {/* X marks */}
            <g className="animate-[xFade_1.5s_ease-in-out_infinite]">
              <path d="M20 25L28 33M28 25L20 33" className="stroke-red-300" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g className="animate-[xFade_1.5s_ease-in-out_infinite_0.5s]">
              <path d="M135 35L141 41M141 35L135 41" className="stroke-rose-300" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g className="animate-[xFade_1.5s_ease-in-out_infinite_1s]">
              <path d="M140 110L146 116M146 110L140 116" className="stroke-red-200" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Gear/settings icon (broken) */}
            <g className="animate-[gearSpin_4s_linear_infinite]" style={{ transformOrigin: '135px 140px' }}>
              <circle cx="135" cy="140" r="8" className="stroke-gray-300" strokeWidth="2" fill="none" />
              <circle cx="135" cy="140" r="3" className="fill-gray-300" />
              <path d="M135 130L135 128 M135 150L135 152 M145 140L147 140 M125 140L123 140" className="stroke-gray-300" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Cloud with issues */}
            <path
              d="M18 75C15 75 12 72 12 69C12 66 15 63 18 63C18 60 21 57 25 57C30 57 34 61 34 66C37 66 40 69 40 72C40 75 37 78 34 78H18C15 78 18 75 18 75Z"
              className="fill-gray-100 stroke-gray-300 animate-[cloudFloat_3s_ease-in-out_infinite]"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-bold text-gray-900">
          {title}
        </h3>
        <p className="text-gray-500 leading-relaxed">
          {message}
        </p>
        {errorCode && (
          <p className="text-xs text-gray-400 font-mono">
            Error code: {errorCode}
          </p>
        )}
      </div>

      {/* What you can try section */}
      <div className="mt-6 bg-white rounded-lg border border-gray-100 p-4 max-w-sm">
        <p className="text-sm font-medium text-gray-700 mb-3">What you can try:</p>
        <ul className="text-sm text-gray-500 space-y-2 text-left">
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh the page and try again
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            Check your internet connection
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Wait a few minutes and try again
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} size="lg" className="gap-2 bg-red-600 hover:bg-red-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </Button>
        )}
        {showHomeButton && (
          <Button variant="outline" asChild size="lg" className="gap-2">
            <Link href="/">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </Link>
          </Button>
        )}
        {showContactSupport && (
          <Button variant="ghost" asChild size="lg">
            <Link href="/contact">Contact Support</Link>
          </Button>
        )}
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes triangleShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-2px) rotate(-1deg); }
          20% { transform: translateX(2px) rotate(1deg); }
          30% { transform: translateX(-2px) rotate(0deg); }
          40% { transform: translateX(2px) rotate(1deg); }
          50% { transform: translateX(-1px) rotate(-1deg); }
          60% { transform: translateX(1px) rotate(0deg); }
          70%, 100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes pieceFly {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(5px) rotate(15deg); opacity: 1; }
        }
        @keyframes xFade {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes gearSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
