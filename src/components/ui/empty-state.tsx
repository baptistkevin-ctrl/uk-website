'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

// SVG Illustrations for each variant
const illustrations = {
  cart: (
    <svg
      className="w-32 h-32 text-gray-300"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shopping cart body */}
      <path
        d="M20 30h8l16 50h50l12-35H40"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Cart wheels */}
      <circle cx="50" cy="95" r="8" stroke="currentColor" strokeWidth="4" fill="none" />
      <circle cx="85" cy="95" r="8" stroke="currentColor" strokeWidth="4" fill="none" />
      {/* Decorative elements */}
      <path
        d="M65 55 L75 65 M75 55 L65 65"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-gray-400"
      />
      {/* Floating circles decoration */}
      <circle cx="100" cy="25" r="3" fill="currentColor" className="text-green-200 animate-pulse" />
      <circle cx="110" cy="40" r="2" fill="currentColor" className="text-green-300 animate-pulse" />
      <circle cx="15" cy="50" r="2" fill="currentColor" className="text-green-200 animate-pulse" />
    </svg>
  ),
  wishlist: (
    <svg
      className="w-32 h-32 text-gray-300"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Heart outline */}
      <path
        d="M64 108C64 108 16 76 16 44C16 24 32 12 48 12C56 12 62 16 64 20C66 16 72 12 80 12C96 12 112 24 112 44C112 76 64 108 64 108Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Dashed inner heart to suggest emptiness */}
      <path
        d="M64 90C64 90 32 66 32 44C32 32 42 24 52 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
        className="text-gray-200"
      />
      {/* Sparkle decorations */}
      <path
        d="M100 20 L100 30 M95 25 L105 25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-pink-300"
      />
      <path
        d="M20 35 L20 42 M16.5 38.5 L23.5 38.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-pink-200"
      />
    </svg>
  ),
  orders: (
    <svg
      className="w-32 h-32 text-gray-300"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clipboard/receipt */}
      <rect
        x="28"
        y="16"
        width="72"
        height="96"
        rx="4"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      {/* Clipboard top */}
      <rect
        x="44"
        y="8"
        width="40"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      {/* Empty lines */}
      <line
        x1="44"
        y1="50"
        x2="84"
        y2="50"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 4"
        className="text-gray-200"
      />
      <line
        x1="44"
        y1="66"
        x2="76"
        y2="66"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 4"
        className="text-gray-200"
      />
      <line
        x1="44"
        y1="82"
        x2="68"
        y2="82"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 4"
        className="text-gray-200"
      />
      {/* Decorative elements */}
      <circle cx="108" cy="30" r="3" fill="currentColor" className="text-blue-200 animate-pulse" />
      <circle cx="18" cy="60" r="2" fill="currentColor" className="text-blue-300 animate-pulse" />
    </svg>
  ),
  search: (
    <svg
      className="w-32 h-32 text-gray-300"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Magnifying glass */}
      <circle
        cx="52"
        cy="52"
        r="32"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      {/* Handle */}
      <line
        x1="76"
        y1="76"
        x2="108"
        y2="108"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Question mark inside */}
      <path
        d="M44 42C44 36 48 32 54 32C60 32 64 36 64 42C64 48 58 50 54 54"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        className="text-gray-400"
      />
      <circle cx="54" cy="64" r="2" fill="currentColor" className="text-gray-400" />
      {/* Decorative dots */}
      <circle cx="20" cy="30" r="3" fill="currentColor" className="text-yellow-200 animate-pulse" />
      <circle cx="100" cy="40" r="2" fill="currentColor" className="text-yellow-300 animate-pulse" />
      <circle cx="30" cy="100" r="2" fill="currentColor" className="text-yellow-200 animate-pulse" />
    </svg>
  ),
  error: (
    <svg
      className="w-32 h-32 text-gray-300"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Warning triangle */}
      <path
        d="M64 20L112 100H16L64 20Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Exclamation mark */}
      <line
        x1="64"
        y1="48"
        x2="64"
        y2="70"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-red-400"
      />
      <circle cx="64" cy="82" r="3" fill="currentColor" className="text-red-400" />
      {/* Decorative elements */}
      <path
        d="M20 40 L28 48 M28 40 L20 48"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-red-200"
      />
      <path
        d="M100 50 L108 58 M108 50 L100 58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-red-200"
      />
    </svg>
  ),
  default: (
    <svg
      className="w-32 h-32 text-gray-300"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Empty box */}
      <rect
        x="24"
        y="40"
        width="80"
        height="60"
        rx="4"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      {/* Box lid */}
      <path
        d="M20 40L64 20L108 40"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Center line */}
      <line
        x1="64"
        y1="20"
        x2="64"
        y2="70"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Decorative sparkles */}
      <circle cx="16" cy="60" r="2" fill="currentColor" className="text-gray-200 animate-pulse" />
      <circle cx="112" cy="55" r="3" fill="currentColor" className="text-gray-200 animate-pulse" />
    </svg>
  ),
}

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center px-6 py-12',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-b from-gray-50 to-white',
        cart: 'bg-gradient-to-b from-green-50/50 to-white',
        wishlist: 'bg-gradient-to-b from-pink-50/50 to-white',
        orders: 'bg-gradient-to-b from-blue-50/50 to-white',
        search: 'bg-gradient-to-b from-yellow-50/50 to-white',
        error: 'bg-gradient-to-b from-red-50/50 to-white',
      },
      size: {
        sm: 'py-8 px-4',
        default: 'py-12 px-6',
        lg: 'py-16 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      variant = 'default',
      size,
      icon,
      title,
      description,
      action,
      secondaryAction,
      ...props
    },
    ref
  ) => {
    const illustration = icon || illustrations[variant || 'default']

    return (
      <div
        ref={ref}
        className={cn(
          emptyStateVariants({ variant, size }),
          'rounded-lg border border-gray-100',
          className
        )}
        {...props}
      >
        {/* Illustration */}
        <div className="relative mb-6">
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 bg-gray-100/50 rounded-full blur-2xl" />
          </div>
          {/* Icon/Illustration */}
          <div className="relative z-10 animate-[bounce_3s_ease-in-out_infinite]">
            {illustration}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-sm space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          )}
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {action && (
              action.href ? (
                <Button asChild>
                  <a href={action.href}>{action.label}</a>
                </Button>
              ) : (
                <Button onClick={action.onClick}>{action.label}</Button>
              )
            )}
            {secondaryAction && (
              secondaryAction.href ? (
                <Button variant="outline" asChild>
                  <a href={secondaryAction.href}>{secondaryAction.label}</a>
                </Button>
              ) : (
                <Button variant="outline" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = 'EmptyState'

// Export illustrations for custom use
export { EmptyState, emptyStateVariants, illustrations }
