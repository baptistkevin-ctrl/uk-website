'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

// ============================================================================
// Loading Spinner - Multiple sizes and variants
// ============================================================================

const spinnerVariants = cva(
  'animate-spin rounded-full border-current',
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border-[1.5px]',
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-[3px]',
        xl: 'h-12 w-12 border-4',
        '2xl': 'h-16 w-16 border-4',
      },
      variant: {
        default: 'border-gray-300 border-t-green-600',
        primary: 'border-green-200 border-t-green-600',
        secondary: 'border-gray-200 border-t-gray-600',
        white: 'border-white/30 border-t-white',
        dark: 'border-gray-700 border-t-gray-900',
        gradient: 'border-transparent',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
  showLabel?: boolean
}

function LoadingSpinner({
  className,
  size,
  variant,
  label = 'Loading...',
  showLabel = false,
  ...props
}: LoadingSpinnerProps) {
  const labelSizeMap = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex flex-col items-center justify-center gap-2', className)}
      {...props}
    >
      <div
        className={cn(
          spinnerVariants({ size, variant }),
          variant === 'gradient' && 'bg-conic-gradient'
        )}
      />
      {showLabel && (
        <span className={cn('text-gray-500 font-medium', labelSizeMap[size || 'md'])}>
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}

// ============================================================================
// Dots Loader - Animated dots loading indicator
// ============================================================================

const dotsVariants = cva('flex items-center justify-center gap-1', {
  variants: {
    size: {
      sm: 'gap-0.5',
      md: 'gap-1',
      lg: 'gap-1.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const dotVariants = cva('rounded-full bg-current animate-bounce', {
  variants: {
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-3 w-3',
    },
    color: {
      default: 'text-green-600',
      gray: 'text-gray-400',
      white: 'text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
  },
})

interface DotsLoaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof dotsVariants>,
    VariantProps<typeof dotVariants> {
  label?: string
}

function DotsLoader({
  className,
  size,
  color,
  label = 'Loading...',
  ...props
}: DotsLoaderProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(dotsVariants({ size }), className)}
      {...props}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(dotVariants({ size, color }))}
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

// ============================================================================
// Pulse Loader - Pulsing circle animation
// ============================================================================

interface PulseLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: 'default' | 'primary' | 'white'
  label?: string
}

function PulseLoader({
  className,
  size = 'md',
  color = 'default',
  label = 'Loading...',
  ...props
}: PulseLoaderProps) {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  const colorMap = {
    default: 'bg-green-600',
    primary: 'bg-green-500',
    white: 'bg-white',
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('relative flex items-center justify-center', className)}
      {...props}
    >
      <div
        className={cn(
          'absolute rounded-full opacity-75 animate-ping',
          sizeMap[size],
          colorMap[color]
        )}
      />
      <div
        className={cn(
          'relative rounded-full opacity-90',
          size === 'sm' && 'h-4 w-4',
          size === 'md' && 'h-6 w-6',
          size === 'lg' && 'h-8 w-8',
          colorMap[color]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

// ============================================================================
// Bar Loader - Animated progress bar
// ============================================================================

interface BarLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: 'default' | 'primary' | 'white'
  label?: string
}

function BarLoader({
  className,
  size = 'md',
  color = 'default',
  label = 'Loading...',
  ...props
}: BarLoaderProps) {
  const heightMap = {
    sm: 'h-0.5',
    md: 'h-1',
    lg: 'h-1.5',
  }

  const colorMap = {
    default: 'bg-green-600',
    primary: 'bg-green-500',
    white: 'bg-white',
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-gray-200', heightMap[size], className)}
      {...props}
    >
      <div
        className={cn(
          'h-full w-1/3 rounded-full animate-loading-bar',
          colorMap[color]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

// ============================================================================
// Full Page Loading Overlay
// ============================================================================

interface FullPageLoadingProps {
  isLoading?: boolean
  message?: string
  variant?: 'spinner' | 'dots' | 'pulse'
  spinnerSize?: 'md' | 'lg' | 'xl' | '2xl'
  backdrop?: 'light' | 'dark' | 'blur'
  className?: string
}

function FullPageLoading({
  isLoading = true,
  message = 'Loading...',
  variant = 'spinner',
  spinnerSize = 'xl',
  backdrop = 'blur',
  className,
}: FullPageLoadingProps) {
  if (!isLoading) return null

  const backdropMap = {
    light: 'bg-white/80',
    dark: 'bg-gray-900/80',
    blur: 'bg-white/60 backdrop-blur-sm',
  }

  const textColorMap = {
    light: 'text-gray-700',
    dark: 'text-white',
    blur: 'text-gray-700',
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        backdropMap[backdrop],
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo placeholder - animated */}
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg animate-pulse">
            <svg
              className="h-8 w-8 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>

        {/* Loader */}
        {variant === 'spinner' && (
          <LoadingSpinner size={spinnerSize} variant="primary" />
        )}
        {variant === 'dots' && <DotsLoader size="lg" />}
        {variant === 'pulse' && <PulseLoader size="lg" />}

        {/* Message */}
        <p
          id="loading-message"
          className={cn(
            'text-lg font-medium animate-pulse',
            textColorMap[backdrop]
          )}
        >
          {message}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// Inline Loading - For inline content loading
// ============================================================================

interface InlineLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

function InlineLoading({
  className,
  size = 'sm',
  message,
  ...props
}: InlineLoadingProps) {
  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      {...props}
    >
      <LoadingSpinner size={size} />
      {message && (
        <span
          className={cn(
            'text-gray-500',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {message}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// Button Loading State Component
// ============================================================================

interface ButtonLoadingProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  spinnerPosition?: 'left' | 'right'
  children: React.ReactNode
}

function ButtonLoading({
  isLoading = false,
  loadingText,
  variant = 'default',
  size = 'md',
  spinnerPosition = 'left',
  children,
  className,
  disabled,
  ...props
}: ButtonLoadingProps) {
  const variantStyles = {
    default: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:bg-gray-100',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50',
    ghost: 'hover:bg-gray-100 text-gray-700 disabled:bg-transparent',
    destructive: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
  }

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-8 text-base',
  }

  const spinnerSizes = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
  }

  const spinnerVariant = variant === 'default' || variant === 'destructive' ? 'white' : 'default'

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-70',
        variantStyles[variant],
        sizeStyles[size],
        isLoading && 'cursor-wait',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && spinnerPosition === 'left' && (
        <LoadingSpinner size={spinnerSizes[size]} variant={spinnerVariant} />
      )}
      <span className={cn(isLoading && 'opacity-80')}>
        {isLoading && loadingText ? loadingText : children}
      </span>
      {isLoading && spinnerPosition === 'right' && (
        <LoadingSpinner size={spinnerSizes[size]} variant={spinnerVariant} />
      )}
    </button>
  )
}

// ============================================================================
// Content Loading Wrapper - Wraps content with loading state
// ============================================================================

interface ContentLoadingProps {
  isLoading?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
  minHeight?: string
}

function ContentLoading({
  isLoading = false,
  children,
  fallback,
  className,
  minHeight = '200px',
}: ContentLoadingProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          className
        )}
        style={{ minHeight }}
      >
        {fallback || <LoadingSpinner size="lg" showLabel label="Loading content..." />}
      </div>
    )
  }

  return <>{children}</>
}

// ============================================================================
// Skeleton Loading with Progress
// ============================================================================

interface ProgressLoadingProps {
  progress: number
  message?: string
  className?: string
}

function ProgressLoading({
  progress,
  message = 'Loading...',
  className,
}: ProgressLoadingProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 w-full max-w-xs', className)}>
      <LoadingSpinner size="lg" />
      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{message}</span>
          <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Shimmer Text - Animated loading text
// ============================================================================

interface ShimmerTextProps {
  text?: string
  className?: string
}

function ShimmerText({
  text = 'Loading',
  className,
}: ShimmerTextProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer font-medium">
        {text}
      </span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </span>
    </div>
  )
}

// ============================================================================
// Export all components
// ============================================================================

export {
  LoadingSpinner,
  DotsLoader,
  PulseLoader,
  BarLoader,
  FullPageLoading,
  InlineLoading,
  ButtonLoading,
  ContentLoading,
  ProgressLoading,
  ShimmerText,
  spinnerVariants,
}
