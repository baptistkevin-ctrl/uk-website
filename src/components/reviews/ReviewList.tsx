'use client'

import { useState, useEffect } from 'react'
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

  const fetchReviews = async (pageNum: number, sort: string) => {
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
  }

  useEffect(() => {
    fetchReviews(1, sortBy)
  }, [productId, sortBy])

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
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Customer Reviews
        </h2>
        {isLoggedIn && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <ReviewForm
            productId={productId}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Summary */}
      {reviewCount > 0 && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
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
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sort by:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">No reviews yet</h3>
          <p className="text-gray-500 text-sm">
            Be the first to review this product!
          </p>
          {isLoggedIn && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
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
            className="inline-flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            <a href="/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign in
            </a>{' '}
            to write a review or vote on reviews
          </p>
        </div>
      )}
    </div>
  )
}
