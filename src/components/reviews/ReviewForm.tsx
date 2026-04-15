'use client'

import { useState } from 'react'
import { StarRating } from './StarRating'
import { X, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ReviewFormProps {
  productId: string
  onSubmit: (data: {
    product_id: string
    rating: number
    title: string
    content: string
    images: string[]
  }) => Promise<void>
  onCancel?: () => void
  className?: string
}

export function ReviewForm({
  productId,
  onSubmit,
  onCancel,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const { url } = await response.json()
          setImages(prev => [...prev, url])
        }
      } catch (err) {
        console.error('Image upload error:', err)
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        product_id: productId,
        rating,
        title,
        content,
        images,
      })
      // Reset form on success
      setRating(0)
      setTitle('')
      setContent('')
      setImages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-foreground">Write a Review</h3>

      {error && (
        <div className="p-3 bg-(--color-error)/5 text-(--color-error) rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-(--color-text-secondary) mb-2">
          Your Rating <span className="text-(--color-error)">*</span>
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
        />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-(--color-text-secondary) mb-1">
          Review Title
        </label>
        <input
          type="text"
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          maxLength={100}
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="review-content" className="block text-sm font-medium text-(--color-text-secondary) mb-1">
          Your Review
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) resize-none"
          maxLength={2000}
        />
        <div className="text-xs text-(--color-text-muted) text-right mt-1">
          {content.length}/2000
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-(--color-text-secondary) mb-2">
          Add Photos (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative w-20 h-20">
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-(--color-error) text-white rounded-full flex items-center justify-center hover:bg-(--color-error)/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="w-20 h-20 border-2 border-dashed border-(--color-border) rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-(--brand-primary) hover:bg-(--brand-primary-light) transition-colors">
              <Upload className="h-5 w-5 text-(--color-text-disabled)" />
              <span className="text-xs text-(--color-text-muted) mt-1">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-(--color-text-muted) mt-1">
          Max 5 images, each up to 5MB
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-(--brand-primary) text-white py-2 px-4 rounded-lg font-medium hover:bg-(--brand-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:bg-background"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-xs text-(--color-text-muted)">
        Your review will be published after moderation.
      </p>
    </form>
  )
}
