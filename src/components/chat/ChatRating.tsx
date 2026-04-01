'use client'

import { Star } from 'lucide-react'

export interface ChatRatingProps {
  readonly rating: number
  readonly feedback: string
  readonly onRatingChange: (rating: number) => void
  readonly onFeedbackChange: (feedback: string) => void
  readonly onSubmit: () => void
  readonly onSkip: () => void
}

export function ChatRating({
  rating,
  feedback,
  onRatingChange,
  onFeedbackChange,
  onSubmit,
  onSkip,
}: ChatRatingProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="text-center mb-6">
        <h4 className="font-semibold text-gray-900 mb-2">How was your experience?</h4>
        <p className="text-sm text-gray-500">Your feedback helps us improve</p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRatingChange(star)}
            className="p-1"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`h-8 w-8 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>

      <textarea
        placeholder="Any additional feedback? (optional)"
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none mb-4"
      />

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Skip
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Submit
        </button>
      </div>
    </div>
  )
}
