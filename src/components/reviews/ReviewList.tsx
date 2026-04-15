'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReviewCard } from './ReviewCard'
import { ReviewSummary } from './ReviewSummary'
import { ReviewForm } from './ReviewForm'
import { Loader2, ChevronDown, Filter, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  images: string[]
  is_verified_purchase: boolean
  helpful_count: number
  not_helpful_count: number
  created_at: string
  profiles: {
    full_name: string | null
    email: string
  } | null
}

interface ReviewListProps {
  productId: string
  avgRating: number
  reviewCount: number
  isLoggedIn?: boolean
  hasOrdered?: boolean
  className?: string
}

export function ReviewList({
  productId,
  avgRating,
  reviewCount,
  isLoggedIn = false,
  hasOrdered = false,
  className,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [breakdown, setBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('recent')
  const [showForm, setShowForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchReviews = useCallback(async (pageNum: number, sort: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/reviews?product_id=${productId}&page=${pageNum}&limit=10&sort=${sort}`
      )
      const data = await res.json()

      if (pageNum === 1) {
        setReviews(data.reviews)
      } else {
        setReviews(prev => [...prev, ...data.reviews])
      }
      setTotalPages(data.totalPages)
      setBreakdown(data.breakdown)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews(1, sortBy)
  }, [fetchReviews, sortBy])

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchReviews(nextPage, sortBy)
    }
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    setPage(1)
  }

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    const res = await fetch(`/api/reviews/${reviewId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_helpful: isHelpful }),
    })

    if (!res.ok) {
      throw new Error('Failed to vote')
    }
  }

  const handleSubmitReview = async (data: {
    product_id: string
    rating: number
    title: string
    content: string
    images: string[]
  }) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to submit review')
    }

    setShowForm(false)
    setSuccessMessage('Your review has been submitted and is pending approval.')
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Customer Reviews
        </h2>
        {isLoggedIn && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-(--brand-primary) text-white px-4 py-2.5 rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-(--brand-primary-light) text-(--brand-primary) rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-background rounded-lg">
          <ReviewForm
            productId={productId}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Summary */}
      {reviewCount > 0 && (
        <div className="mb-8 p-6 bg-background rounded-lg">
          <ReviewSummary
            avgRating={avgRating}
            reviewCount={reviewCount}
            breakdown={breakdown}
          />
        </div>
      )}

      {/* Sort & Filter */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-(--color-text-muted)" />
            <span className="text-sm text-(--color-text-secondary)">Sort by:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm border border-(--color-border) rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {isLoading && reviews.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-background rounded-lg">
          <MessageSquare className="h-12 w-12 text-(--color-text-disabled) mx-auto mb-3" />
          <h3 className="font-medium text-foreground mb-1">No reviews yet</h3>
          <p className="text-(--color-text-muted) text-sm">
            Be the first to review this product!
          </p>
          {isLoggedIn && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium"
            >
              Write a Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVote={handleVote}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {page < totalPages && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:bg-background disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Load More Reviews
          </button>
        </div>
      )}

      {/* Login prompt for non-logged in users */}
      {!isLoggedIn && (
        <div className="mt-6 p-4 bg-background rounded-lg text-center">
          <p className="text-(--color-text-secondary)">
            <a href="/login" className="text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium">
              Sign in
            </a>{' '}
            to write a review or vote on reviews
          </p>
        </div>
      )}
    </div>
  )
}
