'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  const rangeStart = Math.max(2, current - 1)
  const rangeEnd = Math.min(total - 1, current + 1)

  if (rangeStart > 2) {
    pages.push('ellipsis')
  }

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i)
  }

  if (rangeEnd < total - 1) {
    pages.push('ellipsis')
  }

  pages.push(total)

  return pages
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={cn(
          'flex h-9 min-w-[36px] items-center justify-center rounded-md text-sm transition-colors',
          currentPage === 1
            ? 'cursor-not-allowed text-(--color-text-muted) opacity-50'
            : 'text-(--color-text-secondary) hover:bg-(--color-elevated)'
        )}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-9 min-w-[36px] items-center justify-center text-sm text-(--color-text-muted)"
            aria-hidden="true"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              'flex h-9 min-w-[36px] items-center justify-center rounded-md text-sm transition-colors',
              page === currentPage
                ? 'bg-(--brand-primary) font-medium text-white'
                : 'text-(--color-text-secondary) hover:bg-(--color-elevated)'
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={cn(
          'flex h-9 min-w-[36px] items-center justify-center rounded-md text-sm transition-colors',
          currentPage === totalPages
            ? 'cursor-not-allowed text-(--color-text-muted) opacity-50'
            : 'text-(--color-text-secondary) hover:bg-(--color-elevated)'
        )}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
