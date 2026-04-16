'use client'

import { useState, useEffect } from 'react'
import { Star, User, CheckCircle, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  is_verified_purchase: boolean
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

export function StoreReviews({ storeSlug }: { storeSlug: string }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formRating, setFormRating] = useState(0)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [storeSlug])

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/store/${storeSlug}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setAvgRating(data.avgRating || 0)
        setTotalReviews(data.totalReviews || 0)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    if (formRating === 0) { toast.warning('Please select a rating'); return }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/store/${storeSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: formRating, title: formTitle, content: formContent }),
      })

      if (res.ok) {
        toast.success('Review submitted!')
        setShowForm(false)
        setFormRating(0)
        setFormTitle('')
        setFormContent('')
        fetchReviews()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit review')
      }
    } catch {
      toast.error('Failed to submit review')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 fill-(--brand-amber) text-(--brand-amber)" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Store Reviews</h2>
            <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
              <span className="font-semibold text-foreground">{avgRating}</span>
              <span>out of 5</span>
              <span>·</span>
              <span>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        {user && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'} className={showForm ? '' : 'bg-(--brand-primary) hover:bg-(--brand-primary-hover)'}>
            {showForm ? 'Cancel' : 'Write a Review'}
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="rounded-xl border border-(--brand-primary)/20 bg-(--brand-primary)/5 p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Rate this store</h3>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setFormRating(star)} className="p-0.5">
                <Star className={`h-8 w-8 transition-colors ${star <= formRating ? 'fill-(--brand-amber) text-(--brand-amber)' : 'text-(--color-text-disabled)'}`} />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="w-full px-4 py-2.5 mb-3 border border-(--color-border) rounded-lg text-sm bg-background text-foreground focus:border-(--brand-primary) outline-none"
          />
          <textarea
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            placeholder="Share your experience with this store..."
            rows={3}
            className="w-full px-4 py-2.5 mb-4 border border-(--color-border) rounded-lg text-sm bg-background text-foreground focus:border-(--brand-primary) outline-none resize-none"
          />
          <Button onClick={handleSubmit} disabled={submitting} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Submit Review
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-(--brand-primary)" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-(--color-elevated) flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-(--color-text-muted)" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">
                      {review.profiles?.full_name || 'Customer'}
                    </span>
                    {review.is_verified_purchase && (
                      <span className="flex items-center gap-1 text-xs text-(--color-success) font-medium">
                        <CheckCircle className="h-3 w-3" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-(--brand-amber) text-(--brand-amber)' : 'text-(--color-text-disabled)'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-(--color-text-muted)">
                      {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {review.title && <p className="font-medium text-foreground mt-2 text-sm">{review.title}</p>}
                  {review.content && <p className="text-sm text-(--color-text-secondary) mt-1">{review.content}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Star className="h-10 w-10 mx-auto text-(--color-text-disabled) mb-3" />
          <p className="text-sm text-(--color-text-muted)">No reviews yet. Be the first to review this store!</p>
        </div>
      )}
    </div>
  )
}
