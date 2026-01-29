'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import type { Toast as ToastType, ToastAction } from '@/hooks/use-toast'

// Icons for different toast types
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const InfoIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 ease-out',
  {
    variants: {
      type: {
        success:
          'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-900 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-800 dark:text-green-100',
        error:
          'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-900 dark:from-red-950/50 dark:to-rose-950/50 dark:border-red-800 dark:text-red-100',
        warning:
          'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-900 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800 dark:text-amber-100',
        info:
          'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 text-blue-900 dark:from-blue-950/50 dark:to-sky-950/50 dark:border-blue-800 dark:text-blue-100',
      },
    },
    defaultVariants: {
      type: 'info',
    },
  }
)

const iconVariants = cva('h-5 w-5 flex-shrink-0 mt-0.5', {
  variants: {
    type: {
      success: 'text-green-600 dark:text-green-400',
      error: 'text-red-600 dark:text-red-400',
      warning: 'text-amber-600 dark:text-amber-400',
      info: 'text-blue-600 dark:text-blue-400',
    },
  },
  defaultVariants: {
    type: 'info',
  },
})

const closeButtonVariants = cva(
  'absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2',
  {
    variants: {
      type: {
        success:
          'text-green-500 hover:bg-green-100 focus:ring-green-400 dark:hover:bg-green-900',
        error:
          'text-red-500 hover:bg-red-100 focus:ring-red-400 dark:hover:bg-red-900',
        warning:
          'text-amber-500 hover:bg-amber-100 focus:ring-amber-400 dark:hover:bg-amber-900',
        info:
          'text-blue-500 hover:bg-blue-100 focus:ring-blue-400 dark:hover:bg-blue-900',
      },
    },
    defaultVariants: {
      type: 'info',
    },
  }
)

const actionButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      type: {
        success: 'focus:ring-green-400',
        error: 'focus:ring-red-400',
        warning: 'focus:ring-amber-400',
        info: 'focus:ring-blue-400',
      },
      variant: {
        default: '',
        outline: 'border bg-transparent',
      },
    },
    compoundVariants: [
      {
        type: 'success',
        variant: 'default',
        className: 'bg-green-600 text-white hover:bg-green-700',
      },
      {
        type: 'success',
        variant: 'outline',
        className: 'border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900',
      },
      {
        type: 'error',
        variant: 'default',
        className: 'bg-red-600 text-white hover:bg-red-700',
      },
      {
        type: 'error',
        variant: 'outline',
        className: 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900',
      },
      {
        type: 'warning',
        variant: 'default',
        className: 'bg-amber-600 text-white hover:bg-amber-700',
      },
      {
        type: 'warning',
        variant: 'outline',
        className: 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900',
      },
      {
        type: 'info',
        variant: 'default',
        className: 'bg-blue-600 text-white hover:bg-blue-700',
      },
      {
        type: 'info',
        variant: 'outline',
        className: 'border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900',
      },
    ],
    defaultVariants: {
      type: 'info',
      variant: 'default',
    },
  }
)

interface ToastIconProps extends VariantProps<typeof iconVariants> {}

const ToastIcon = ({ type }: ToastIconProps) => {
  const className = iconVariants({ type })

  switch (type) {
    case 'success':
      return <CheckCircleIcon className={className} />
    case 'error':
      return <XCircleIcon className={className} />
    case 'warning':
      return <AlertTriangleIcon className={className} />
    case 'info':
    default:
      return <InfoIcon className={className} />
  }
}

export interface ToastProps extends ToastType {
  onDismiss?: () => void
  className?: string
  isExiting?: boolean
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      type,
      title,
      description,
      dismissable = true,
      action,
      onDismiss,
      className,
      isExiting = false,
    },
    ref
  ) => {
    const handleActionClick = (actionHandler: ToastAction) => {
      actionHandler.onClick()
      if (onDismiss) {
        onDismiss()
      }
    }

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-toast-id={id}
        className={cn(
          toastVariants({ type }),
          isExiting
            ? 'animate-toast-exit translate-x-full opacity-0'
            : 'animate-toast-enter translate-x-0 opacity-100',
          className
        )}
      >
        <ToastIcon type={type} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{title}</p>
              {description && (
                <p className="mt-1 text-sm opacity-90 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {action && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleActionClick(action)}
                className={cn(
                  actionButtonVariants({
                    type,
                    variant: action.variant || 'default',
                  })
                )}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        {dismissable && (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(closeButtonVariants({ type }))}
            aria-label="Dismiss notification"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}

        {/* Progress bar for visual timing feedback */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-bl-lg"
          style={{
            animation: 'toast-progress linear forwards',
          }}
        />
      </div>
    )
  }
)

Toast.displayName = 'Toast'

export { Toast, toastVariants }
