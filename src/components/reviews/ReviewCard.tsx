'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ThumbsUp, ThumbsDown, CheckCircle, User } from 'lucide-react'
import { StarRating } from './StarRating'
import { cn } from '@/lib/utils/cn'

interface ReviewCardProps {
  review: {
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
  onVote?: (reviewId: string, isHelpful: boolean) => Promise<void>
  isLoggedIn?: boolean
  className?: string
}

export function ReviewCard({
  review,
  onVote,
  isLoggedIn = false,
  className,
}: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [localHelpful, setLocalHelpful] = useState(review.helpful_count)
  const [localNotHelpful, setLocalNotHelpful] = useState(review.not_helpful_count)
  const [showAllImages, setShowAllImages] = useState(false)

  const displayName = review.profiles?.full_name ||
    review.profiles?.email?.split('@')[0] ||
    'Anonymous'

  const handleVote = async (isHelpful: boolean) => {
    if (!onVote || isVoting) return

    setIsVoting(true)
    try {
      await onVote(review.id, isHelpful)
      // Optimistically update counts
      if (isHelpful) {
        setLocalHelpful(prev => prev + 1)
      } else {
        setLocalNotHelpful(prev => prev + 1)
      }
    } catch (error) {
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const displayImages = showAllImages ? review.images : review.images.slice(0, 3)

  return (
    <div className={cn('border-b border-gray-200 py-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{displayName}</span>
              {review.is_verified_purchase && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-900 mt-3">{review.title}</h4>
      )}

      {/* Review Content */}
      {review.content && (
        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{review.content}</p>
      )}

      {/* Review Images */}
      {review.images.length > 0 && (
        <div className="mt-3">
          <div className="flex gap-2 flex-wrap">
            {displayImages.map((image, index) => (
              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={`Review image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            {!showAllImages && review.images.length > 3 && (
              <button
                onClick={() => setShowAllImages(true)}
                className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                +{review.images.length - 3}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Helpful Votes */}
      <div className="flex items-center gap-4 mt-4">
        <span className="text-sm text-gray-500">Was this review helpful?</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleVote(true)}
            disabled={!isLoggedIn || isVoting}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full transition-colors',
              isLoggedIn
                ? 'text-gray-600 hover:bg-gray-100 hover:text-green-600'
                : 'text-gray-400 cursor-not-allowed'
            )}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{localHelpful}</span>
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={!isLoggedIn || isVoting}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full transition-colors',
              isLoggedIn
                ? 'text-gray-600 hover:bg-gray-100 hover:text-red-600'
                : 'text-gray-400 cursor-not-allowed'
            )}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{localNotHelpful}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
