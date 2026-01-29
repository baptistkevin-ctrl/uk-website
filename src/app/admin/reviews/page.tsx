'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  Loader2,
  MessageSquare,
  Check,
  X,
  Trash2,
  Eye,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  ImageIcon,
  ThumbsUp,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'

interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string
  content: string
  images: string[] | null
  is_verified_purchase: boolean
  helpful_count: number
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  profiles: {
    full_name: string | null
    email: string
  } | null
  products: {
    name: string
    slug: string
    image_url: string | null
  } | null
}

interface ReviewCounts {
  pending: number
  approved: number
  rejected: number
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-700' },
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState<ReviewCounts>({ pending: 0, approved: 0, rejected: 0 })

  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [moderating, setModerating] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      })
      const res = await fetch(`/api/admin/reviews?${params}`)
      const data = await res.json()
      if (data.reviews) {
        setReviews(data.reviews)
        setTotalPages(data.totalPages || 1)
        if (data.counts) {
          setCounts(data.counts)
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [statusFilter, page])

  const moderateReview = async (reviewId: string, status: 'approved' | 'rejected') => {
    setModerating(reviewId)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewId,
          status,
          admin_notes: adminNotes || null,
        }),
      })
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId))
        setCounts(prev => ({
          ...prev,
          pending: prev.pending - 1,
          [status]: (prev[status as keyof ReviewCounts] || 0) + 1,
        }))
        setShowDetailModal(false)
        setSelectedReview(null)
        setAdminNotes('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to moderate review')
      }
    } catch (error) {
      console.error('Error moderating review:', error)
      alert('Failed to moderate review')
    }
    setModerating(null)
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return

    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId))
        setShowDetailModal(false)
        setSelectedReview(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const openReviewDetail = (review: Review) => {
    setSelectedReview(review)
    setAdminNotes(review.admin_notes || '')
    setShowDetailModal(true)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Review Moderation</h1>
        <p className="text-slate-500 mt-1">Approve, reject, or delete customer reviews</p>
      </div>

      {/* Stats Tabs */}
      <div className="flex flex-wrap gap-4">
        {(['pending', 'approved', 'rejected'] as const).map((status) => {
          const config = statusConfig[status]
          const Icon = config.icon
          const count = counts[status] || 0
          return (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1) }}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
                statusFilter === status
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2 rounded-lg ${config.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-500">{config.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No {statusFilter} reviews</h3>
          <p className="text-slate-500">
            {statusFilter === 'pending'
              ? 'All reviews have been moderated'
              : `No reviews with ${statusFilter} status`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {review.products?.image_url ? (
                    <Image
                      src={review.products.image_url}
                      alt={review.products.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <Link
                        href={`/products/${review.products?.slug}`}
                        target="_blank"
                        className="font-semibold text-slate-900 hover:text-emerald-600 flex items-center gap-1"
                      >
                        {review.products?.name || 'Unknown Product'}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <div className="flex items-center gap-3 mt-1">
                        {renderStars(review.rating)}
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusFilter === 'pending' ? (
                        <>
                          <button
                            onClick={() => moderateReview(review.id, 'approved')}
                            disabled={moderating === review.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          >
                            {moderating === review.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => moderateReview(review.id, 'rejected')}
                            disabled={moderating === review.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[review.status].color}`}>
                          {statusConfig[review.status].label}
                        </span>
                      )}
                      <button
                        onClick={() => openReviewDetail(review)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Review Title & Content */}
                  {review.title && (
                    <h4 className="font-medium text-slate-900 mb-1">{review.title}</h4>
                  )}
                  <p className="text-slate-600 text-sm line-clamp-2">{review.content}</p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.slice(0, 4).map((img, idx) => (
                        <Image
                          key={idx}
                          src={img}
                          alt={`Review image ${idx + 1}`}
                          width={60}
                          height={60}
                          className="w-15 h-15 rounded-lg object-cover"
                        />
                      ))}
                      {review.images.length > 4 && (
                        <div className="w-15 h-15 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500">
                          +{review.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{review.profiles?.full_name || review.profiles?.email || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                    {review.helpful_count > 0 && (
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{review.helpful_count} helpful</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {showDetailModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Review Details</h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedReview(null); setAdminNotes('') }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                {selectedReview.products?.image_url ? (
                  <Image
                    src={selectedReview.products.image_url}
                    alt={selectedReview.products.name}
                    width={60}
                    height={60}
                    className="w-15 h-15 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-15 h-15 rounded-lg bg-slate-200 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{selectedReview.products?.name}</p>
                  <Link
                    href={`/products/${selectedReview.products?.slug}`}
                    target="_blank"
                    className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    View Product <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Reviewer Info */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {selectedReview.profiles?.full_name || 'No name'}
                    </p>
                    <p className="text-sm text-slate-500">{selectedReview.profiles?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{formatDate(selectedReview.created_at)}</p>
                  {selectedReview.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified Purchase
                    </span>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating)}
                  <span className="font-semibold text-slate-900">{selectedReview.rating}/5</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedReview.status].color}`}>
                  {statusConfig[selectedReview.status].label}
                </span>
              </div>

              {/* Review Content */}
              {selectedReview.title && (
                <h3 className="text-lg font-semibold text-slate-900">{selectedReview.title}</h3>
              )}
              <p className="text-slate-600 whitespace-pre-wrap">{selectedReview.content}</p>

              {/* Review Images */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Attached Images</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedReview.images.map((img, idx) => (
                      <Image
                        key={idx}
                        src={img}
                        alt={`Review image ${idx + 1}`}
                        width={120}
                        height={120}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Notes (internal)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Add notes about this review (only visible to admins)..."
                />
              </div>

              {/* Warning for flagged content */}
              {selectedReview.content.length < 20 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Short Review</p>
                    <p className="text-sm text-amber-700">This review has very little content. Consider whether it provides value.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => deleteReview(selectedReview.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Review
              </button>
              <div className="flex gap-3">
                {selectedReview.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => moderateReview(selectedReview.id, 'rejected')}
                      disabled={moderating === selectedReview.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => moderateReview(selectedReview.id, 'approved')}
                      disabled={moderating === selectedReview.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {moderating === selectedReview.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowDetailModal(false); setSelectedReview(null); setAdminNotes('') }}
                    className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
