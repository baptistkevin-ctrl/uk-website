'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Star, Upload, X, Loader2, Camera, Check } from 'lucide-react'

interface ReviewFormProps {
  productId: string
  productName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({ productId, productName, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i])
    }

    try {
      const res = await fetch('/api/reviews/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        setImages([...images, ...data.urls])
      } else {
        setError(data.error || 'Failed to upload images')
      }
    } catch (err) {
      setError('Failed to upload images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          rating,
          title,
          content,
          images
        })
      })

      const data = await res.json()

      if (data.review) {
        setSuccess(true)
        onSuccess?.()
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (err) {
      setError('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-(--brand-primary-light) rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-(--brand-primary-light) rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-(--brand-primary)" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Thank You!</h3>
        <p className="text-(--color-text-secondary)">
          Your review has been submitted and is pending approval.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Write a Review</h3>
        <p className="text-sm text-(--color-text-muted)">Share your experience with {productName}</p>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-(--color-text-secondary) mb-2">
          Your Rating *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 focus:outline-none"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-(--color-text-disabled)'
                } transition-colors`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-(--color-text-muted) self-center">
            {rating > 0 && (
              <>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-(--color-text-secondary) mb-1">
          Review Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience in a few words"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          maxLength={100}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-(--color-text-secondary) mb-1">
          Your Review
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you like or dislike? How did you use the product?"
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-(--color-text-disabled) mt-1">{content.length}/1000 characters</p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-(--color-text-secondary) mb-2">
          Add Photos (optional)
        </label>
        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative w-20 h-20 group">
              <Image
                src={url}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-(--color-error) text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {images.length < 5 && (
            <label className="w-20 h-20 border-2 border-dashed border-(--color-border) rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-(--brand-primary) hover:bg-(--brand-primary-light) transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 className="h-6 w-6 text-(--color-text-disabled) animate-spin" />
              ) : (
                <>
                  <Camera className="h-6 w-6 text-(--color-text-disabled)" />
                  <span className="text-xs text-(--color-text-muted) mt-1">Add</span>
                </>
              )}
            </label>
          )}
        </div>
        <p className="text-xs text-(--color-text-disabled) mt-2">
          Upload up to 5 images. Max 5MB each. JPEG, PNG, WebP, or GIF.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-(--color-error)/5 border border-(--color-error)/20 rounded-lg text-(--color-error) text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-(--color-border) text-(--color-text-secondary) rounded-lg hover:bg-background"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex-1 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </form>
  )
}
