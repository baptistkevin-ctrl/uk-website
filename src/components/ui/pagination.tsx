'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// Pagination Root
// ============================================================================

const paginationVariants = cva('flex items-center', {
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

interface PaginationContextValue {
  size: 'sm' | 'md' | 'lg'
  currentPage: number
  onPageChange: (page: number) => void
  totalPages: number
}

const PaginationContext = React.createContext<PaginationContextValue | null>(null)

function usePaginationContext() {
  const context = React.useContext(PaginationContext)
  if (!context) {
    throw new Error('Pagination components must be used within a Pagination component')
  }
  return context
}

export interface PaginationProps
  extends React.ComponentPropsWithoutRef<'nav'>,
    VariantProps<typeof paginationVariants> {
  /** Current active page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      currentPage,
      totalPages,
      onPageChange,
      size = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const contextValue = React.useMemo(
      () => ({
        size,
        currentPage,
        onPageChange,
        totalPages,
      }),
      [size, currentPage, onPageChange, totalPages]
    )

    return (
      <PaginationContext.Provider value={contextValue}>
        <nav
          ref={ref}
          role="navigation"
          aria-label="Pagination"
          className={cn(paginationVariants({ size }), className)}
          {...props}
        >
          {children}
        </nav>
      </PaginationContext.Provider>
    )
  }
)
Pagination.displayName = 'Pagination'

// ============================================================================
// Pagination Content (wraps the page items)
// ============================================================================

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentPropsWithoutRef<'ul'>
>(({ className, ...props }, ref) => {
  const { size } = usePaginationContext()

  return (
    <ul
      ref={ref}
      className={cn(
        'flex items-center',
        {
          'gap-0.5': size === 'sm',
          'gap-1': size === 'md',
          'gap-1.5': size === 'lg',
        },
        className
      )}
      {...props}
    />
  )
})
PaginationContent.displayName = 'PaginationContent'

// ============================================================================
// Pagination Item (wrapper for each item)
// ============================================================================

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
))
PaginationItem.displayName = 'PaginationItem'

// ============================================================================
// Pagination Button Variants
// ============================================================================

const paginationButtonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        active: 'bg-green-600 text-white hover:bg-green-700 border-green-600',
        ghost: 'text-gray-700 hover:bg-gray-100',
      },
      size: {
        sm: 'h-8 min-w-8 text-xs rounded-md px-2',
        md: 'h-9 min-w-9 text-sm rounded-md px-3',
        lg: 'h-10 min-w-10 text-base rounded-lg px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

// ============================================================================
// Pagination Link (clickable page number)
// ============================================================================

export interface PaginationLinkProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Page number this link represents */
  page: number
  /** Whether this is the current page */
  isActive?: boolean
}

const PaginationLink = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, page, isActive, ...props }, ref) => {
    const { size, currentPage, onPageChange } = usePaginationContext()
    const active = isActive ?? page === currentPage

    const handleClick = () => {
      onPageChange(page)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onPageChange(page)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          paginationButtonVariants({
            variant: active ? 'active' : 'default',
            size,
          }),
          className
        )}
        aria-label={`Go to page ${page}`}
        aria-current={active ? 'page' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {page}
      </button>
    )
  }
)
PaginationLink.displayName = 'PaginationLink'

// ============================================================================
// Pagination Previous Button
// ============================================================================

export interface PaginationPreviousProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Whether to show the label text (hidden on mobile by default) */
  showLabel?: boolean
}

const PaginationPrevious = React.forwardRef<
  HTMLButtonElement,
  PaginationPreviousProps
>(({ className, showLabel = true, disabled, ...props }, ref) => {
  const { size, currentPage, onPageChange } = usePaginationContext()
  const isDisabled = disabled ?? currentPage <= 1

  const handleClick = () => {
    if (!isDisabled) {
      onPageChange(currentPage - 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
      e.preventDefault()
      onPageChange(currentPage - 1)
    }
  }

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  }[size]

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        paginationButtonVariants({ variant: 'default', size }),
        'gap-1',
        className
      )}
      aria-label="Go to previous page"
      disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <ChevronLeft size={iconSize} />
      {showLabel && (
        <span className="hidden sm:inline">Previous</span>
      )}
    </button>
  )
})
PaginationPrevious.displayName = 'PaginationPrevious'

// ============================================================================
// Pagination Next Button
// ============================================================================

export interface PaginationNextProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Whether to show the label text (hidden on mobile by default) */
  showLabel?: boolean
}

const PaginationNext = React.forwardRef<HTMLButtonElement, PaginationNextProps>(
  ({ className, showLabel = true, disabled, ...props }, ref) => {
    const { size, currentPage, totalPages, onPageChange } = usePaginationContext()
    const isDisabled = disabled ?? currentPage >= totalPages

    const handleClick = () => {
      if (!isDisabled) {
        onPageChange(currentPage + 1)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
        e.preventDefault()
        onPageChange(currentPage + 1)
      }
    }

    const iconSize = {
      sm: 14,
      md: 16,
      lg: 18,
    }[size]

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          paginationButtonVariants({ variant: 'default', size }),
          'gap-1',
          className
        )}
        aria-label="Go to next page"
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {showLabel && (
          <span className="hidden sm:inline">Next</span>
        )}
        <ChevronRight size={iconSize} />
      </button>
    )
  }
)
PaginationNext.displayName = 'PaginationNext'

// ============================================================================
// Pagination First Button
// ============================================================================

export interface PaginationFirstProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Whether to show the label text */
  showLabel?: boolean
}

const PaginationFirst = React.forwardRef<HTMLButtonElement, PaginationFirstProps>(
  ({ className, showLabel = false, disabled, ...props }, ref) => {
    const { size, currentPage, onPageChange } = usePaginationContext()
    const isDisabled = disabled ?? currentPage <= 1

    const handleClick = () => {
      if (!isDisabled) {
        onPageChange(1)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
        e.preventDefault()
        onPageChange(1)
      }
    }

    const iconSize = {
      sm: 14,
      md: 16,
      lg: 18,
    }[size]

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          paginationButtonVariants({ variant: 'default', size }),
          'gap-1',
          className
        )}
        aria-label="Go to first page"
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <ChevronsLeft size={iconSize} />
        {showLabel && <span className="hidden sm:inline">First</span>}
      </button>
    )
  }
)
PaginationFirst.displayName = 'PaginationFirst'

// ============================================================================
// Pagination Last Button
// ============================================================================

export interface PaginationLastProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Whether to show the label text */
  showLabel?: boolean
}

const PaginationLast = React.forwardRef<HTMLButtonElement, PaginationLastProps>(
  ({ className, showLabel = false, disabled, ...props }, ref) => {
    const { size, currentPage, totalPages, onPageChange } = usePaginationContext()
    const isDisabled = disabled ?? currentPage >= totalPages

    const handleClick = () => {
      if (!isDisabled) {
        onPageChange(totalPages)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
        e.preventDefault()
        onPageChange(totalPages)
      }
    }

    const iconSize = {
      sm: 14,
      md: 16,
      lg: 18,
    }[size]

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          paginationButtonVariants({ variant: 'default', size }),
          'gap-1',
          className
        )}
        aria-label="Go to last page"
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {showLabel && <span className="hidden sm:inline">Last</span>}
        <ChevronsRight size={iconSize} />
      </button>
    )
  }
)
PaginationLast.displayName = 'PaginationLast'

// ============================================================================
// Pagination Ellipsis
// ============================================================================

const PaginationEllipsis = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(({ className, ...props }, ref) => {
  const { size } = usePaginationContext()

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  }[size]

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        'flex items-center justify-center text-gray-400',
        {
          'h-8 w-8': size === 'sm',
          'h-9 w-9': size === 'md',
          'h-10 w-10': size === 'lg',
        },
        className
      )}
      {...props}
    >
      <MoreHorizontal size={iconSize} />
      <span className="sr-only">More pages</span>
    </span>
  )
})
PaginationEllipsis.displayName = 'PaginationEllipsis'

// ============================================================================
// Pagination Info (showing "Page X of Y" or "Showing X-Y of Z")
// ============================================================================

export interface PaginationInfoProps
  extends React.ComponentPropsWithoutRef<'div'> {
  /** Total number of items (for "Showing X-Y of Z" format) */
  totalItems?: number
  /** Items per page (for "Showing X-Y of Z" format) */
  pageSize?: number
  /** Format to display: 'pages' for "Page X of Y", 'items' for "Showing X-Y of Z" */
  format?: 'pages' | 'items'
}

const PaginationInfo = React.forwardRef<HTMLDivElement, PaginationInfoProps>(
  (
    { className, totalItems, pageSize = 10, format = 'pages', ...props },
    ref
  ) => {
    const { size, currentPage, totalPages } = usePaginationContext()

    const textSize = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    }[size]

    if (format === 'items' && totalItems !== undefined) {
      const startItem = (currentPage - 1) * pageSize + 1
      const endItem = Math.min(currentPage * pageSize, totalItems)

      return (
        <div
          ref={ref}
          className={cn(textSize, 'text-gray-600', className)}
          {...props}
        >
          Showing{' '}
          <span className="font-medium text-gray-900">{startItem}</span>
          {' - '}
          <span className="font-medium text-gray-900">{endItem}</span>
          {' of '}
          <span className="font-medium text-gray-900">{totalItems}</span>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(textSize, 'text-gray-600', className)}
        {...props}
      >
        Page{' '}
        <span className="font-medium text-gray-900">{currentPage}</span>
        {' of '}
        <span className="font-medium text-gray-900">{totalPages}</span>
      </div>
    )
  }
)
PaginationInfo.displayName = 'PaginationInfo'

// ============================================================================
// Full Pagination Component (all-in-one)
// ============================================================================

export interface FullPaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Array of page numbers/ellipsis to display */
  pageRange: (number | 'ellipsis')[]
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show First/Last buttons */
  showFirstLast?: boolean
  /** Whether to show Previous/Next buttons */
  showPrevNext?: boolean
  /** Whether to show page info */
  showInfo?: boolean
  /** Total items (for info display) */
  totalItems?: number
  /** Page size (for info display) */
  pageSize?: number
  /** Info format */
  infoFormat?: 'pages' | 'items'
  /** Additional class name */
  className?: string
}

const FullPagination = React.forwardRef<HTMLElement, FullPaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      pageRange,
      size = 'md',
      showFirstLast = true,
      showPrevNext = true,
      showInfo = false,
      totalItems,
      pageSize,
      infoFormat = 'pages',
      className,
    },
    ref
  ) => {
    // Keyboard navigation for the whole component
    const containerRef = React.useRef<HTMLElement>(null)

    React.useImperativeHandle(ref, () => containerRef.current!)

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowLeft':
            if (currentPage > 1) {
              e.preventDefault()
              onPageChange(currentPage - 1)
            }
            break
          case 'ArrowRight':
            if (currentPage < totalPages) {
              e.preventDefault()
              onPageChange(currentPage + 1)
            }
            break
          case 'Home':
            if (currentPage !== 1) {
              e.preventDefault()
              onPageChange(1)
            }
            break
          case 'End':
            if (currentPage !== totalPages) {
              e.preventDefault()
              onPageChange(totalPages)
            }
            break
        }
      },
      [currentPage, totalPages, onPageChange]
    )

    if (totalPages <= 1) {
      return null
    }

    return (
      <div
        className={cn(
          'flex flex-col items-center gap-3 sm:flex-row sm:justify-between',
          className
        )}
        onKeyDown={handleKeyDown}
      >
        {showInfo && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            size={size}
            className="order-2 sm:order-1"
          >
            <PaginationInfo
              totalItems={totalItems}
              pageSize={pageSize}
              format={infoFormat}
            />
          </Pagination>
        )}

        <Pagination
          ref={containerRef}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          size={size}
          className={cn('order-1 sm:order-2', !showInfo && 'sm:mx-auto')}
        >
          <PaginationContent>
            {/* First Button - Hidden on mobile */}
            {showFirstLast && (
              <PaginationItem className="hidden sm:block">
                <PaginationFirst />
              </PaginationItem>
            )}

            {/* Previous Button */}
            {showPrevNext && (
              <PaginationItem>
                <PaginationPrevious />
              </PaginationItem>
            )}

            {/* Page Numbers - Simplified on mobile */}
            <div className="hidden sm:flex sm:items-center sm:gap-1">
              {pageRange.map((page, index) => (
                <PaginationItem key={`${page}-${index}`}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink page={page} />
                  )}
                </PaginationItem>
              ))}
            </div>

            {/* Mobile: Just show current page indicator */}
            <div className="flex items-center gap-1 sm:hidden">
              <span
                className={cn(
                  'text-gray-600',
                  size === 'sm' && 'text-xs px-2',
                  size === 'md' && 'text-sm px-3',
                  size === 'lg' && 'text-base px-4'
                )}
              >
                {currentPage} / {totalPages}
              </span>
            </div>

            {/* Next Button */}
            {showPrevNext && (
              <PaginationItem>
                <PaginationNext />
              </PaginationItem>
            )}

            {/* Last Button - Hidden on mobile */}
            {showFirstLast && (
              <PaginationItem className="hidden sm:block">
                <PaginationLast />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    )
  }
)
FullPagination.displayName = 'FullPagination'

// ============================================================================
// Exports
// ============================================================================

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
  PaginationInfo,
  FullPagination,
  paginationButtonVariants,
}
