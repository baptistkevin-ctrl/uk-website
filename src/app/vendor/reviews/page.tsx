'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Star,
  Loader2,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ThumbsUp,
  Package,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Review {
  id: string
  product_id: string
  rating: number
  title: string
  content: string
  images: string[] | null
  is_verified_purchase: boolean
  helpful_count: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles: { full_name: string | null; email: string } | null
  products: { name: string; slug: string; image_url: string | null } | null
}

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ average: 0, total: 0, pending: 0 })

  useEffect(() => {
    fetchReviews()
  }, [statusFilter, page])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString() })
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/vendor/reviews?${params}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setTotalPages(data.totalPages || 1)
      if (data.stats) setStats(data.stats)
    } catch (error) {
      console.error('Fetch reviews error:', error)
    }
    setLoading(false)
  }

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-(--color-text-disabled)'}`} />
      ))}
    </div>
  )

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-(--color-warning-bg) text-(--color-warning)',
      approved: 'bg-(--brand-primary-light) text-(--brand-primary)',
      rejected: 'bg-(--color-error-bg) text-(--color-error)',
    }
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${styles[status] || 'bg-(--color-elevated)'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Product Reviews</h1>
        <p className="text-(--color-text-secondary)">See what customers say about your products</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-(--color-surface) rounded-xl shadow-sm p-5 border border-(--color-border)">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-(--color-warning-bg) rounded-lg flex items-center justify-center">
              <Star className="h-5 w-5 text-(--color-warning)" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.average}</p>
              <p className="text-sm text-(--color-text-muted)">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-(--color-surface) rounded-xl shadow-sm p-5 border border-(--color-border)">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-(--color-info)" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-(--color-text-muted)">Total Reviews</p>
            </div>
          </div>
        </div>
        <div className="bg-(--color-surface) rounded-xl shadow-sm p-5 border border-(--color-border)">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-(--color-warning-bg) rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-(--brand-amber)" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-sm text-(--color-text-muted)">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-(--color-surface) rounded-xl shadow-sm p-4 border border-(--color-border)">
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-(--brand-primary) text-white'
                  : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-(--color-surface) rounded-xl shadow-sm p-12 text-center border border-(--color-border)">
          <MessageSquare className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No reviews yet</h3>
          <p className="text-(--color-text-muted)">Reviews will appear here when customers review your products</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-(--color-surface) rounded-xl shadow-sm p-5 border border-(--color-border)">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  {review.products?.image_url ? (
                    <Image
                      src={review.products.image_url}
                      alt={review.products.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-(--color-elevated) rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-(--color-text-disabled)" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{review.products?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      {statusBadge(review.status)}
                      {review.is_verified_purchase && (
                        <span className="text-xs text-(--brand-primary) font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-(--color-text-disabled)">
                  {new Date(review.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>

              <div className="mt-3 ml-16">
                {review.title && <p className="font-semibold text-foreground">{review.title}</p>}
                <p className="text-(--color-text-secondary) text-sm mt-1">{review.content}</p>

                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {review.images.map((img, i) => (
                      <Image key={i} src={img} alt="" width={64} height={64} className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 text-sm text-(--color-text-muted)">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {review.profiles?.full_name || review.profiles?.email || 'Anonymous'}
                  </span>
                  {review.helpful_count > 0 && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {review.helpful_count} helpful
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-(--color-text-muted)">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
