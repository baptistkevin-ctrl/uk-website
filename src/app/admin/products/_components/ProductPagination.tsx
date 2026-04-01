'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductPaginationProps {
  currentPage: number
  totalPages: number
  startIndex: number
  endIndex: number
  totalItems: number
  onPageChange: (page: number) => void
}

export default function ProductPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange,
}: ProductPaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Showing info */}
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
          <span className="font-semibold text-slate-900">{Math.min(endIndex, totalItems)}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalItems}</span> products
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-xl transition-colors ${
                  page === currentPage
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : page === '...'
                    ? 'bg-transparent text-slate-400 cursor-default'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Mobile page indicator */}
          <div className="sm:hidden text-sm font-medium text-slate-600">
            Page {currentPage} of {totalPages}
          </div>

          {/* Next button */}
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:hover:bg-slate-100"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
