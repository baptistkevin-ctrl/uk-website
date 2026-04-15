'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageCircleQuestion,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  Store,
  Shield,
  Loader2,
  HelpCircle
} from 'lucide-react'

interface Question {
  id: string
  question: string
  status: string
  is_featured: boolean
  helpful_count: number
  created_at: string
  user: { id: string; full_name: string; avatar_url: string | null } | null
  guest_name: string | null
  answers: Answer[]
}

interface Answer {
  id: string
  answer: string
  is_official: boolean
  helpful_count: number
  created_at: string
  user: { id: string; full_name: string; avatar_url: string | null } | null
  vendor: { id: string; business_name: string; logo_url: string | null } | null
}

interface ProductQAProps {
  productSlug: string
  isLoggedIn: boolean
}

export function ProductQA({ productSlug, isLoggedIn }: ProductQAProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null)
  const [newAnswer, setNewAnswer] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productSlug}/questions?page=${page}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        if (page === 1) {
          setQuestions(data.questions)
        } else {
          setQuestions(prev => [...prev, ...data.questions])
        }
        setHasMore(data.pagination.page < data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }, [productSlug, page])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const submitQuestion = async () => {
    if (!newQuestion.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/products/${productSlug}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          guest_name: guestName || undefined,
          guest_email: guestEmail || undefined
        })
      })

      if (res.ok) {
        setNewQuestion('')
        setGuestName('')
        setGuestEmail('')
        setShowForm(false)
        setSuccessMessage('Your question has been submitted and will appear once approved.')
        setTimeout(() => setSuccessMessage(''), 5000)
      }
    } catch (error) {
      console.error('Failed to submit question:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const submitAnswer = async (questionId: string) => {
    if (!newAnswer.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: newAnswer })
      })

      if (res.ok) {
        const data = await res.json()
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId
              ? { ...q, answers: [...q.answers, data.answer] }
              : q
          )
        )
        setNewAnswer('')
        setAnsweringQuestion(null)
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5 sm:h-6 sm:w-6 text-(--brand-primary) shrink-0" />
          <span>
            Customer Questions & Answers
            {questions.length > 0 && (
              <span className="text-sm font-normal text-(--color-text-muted) ml-1">
                ({questions.length})
              </span>
            )}
          </span>
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="shrink-0 h-10 px-4 bg-(--brand-primary) text-white text-sm font-semibold rounded-lg hover:bg-(--brand-primary-hover) transition-colors flex items-center justify-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Ask a Question
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-(--brand-primary-light) border border-(--brand-primary) rounded-lg text-(--brand-primary)">
          {successMessage}
        </div>
      )}

      {/* Question Form */}
      {showForm && (
        <div className="bg-background rounded-xl p-6 border border-(--color-border)">
          <h3 className="font-semibold text-foreground mb-4">Ask about this product</h3>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What would you like to know about this product?"
            rows={3}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) resize-none"
          />

          {!isLoggedIn && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name (optional)"
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
              />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Your email (for notifications)"
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-(--color-border) rounded-lg hover:bg-background"
            >
              Cancel
            </button>
            <button
              onClick={submitQuestion}
              disabled={!newQuestion.trim() || submitting}
              className="px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Question
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-12 bg-background rounded-xl">
          <MessageCircleQuestion className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
          <p className="text-(--color-text-muted)">No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className={`border rounded-xl overflow-hidden ${
                question.is_featured ? 'border-(--brand-primary) bg-(--brand-primary-light)/30' : 'border-(--color-border)'
              }`}
            >
              {/* Question */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-(--brand-primary-light) rounded-full flex items-center justify-center shrink-0">
                    <span className="text-(--brand-primary) font-bold text-sm">Q</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{question.question}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-(--color-text-muted)">
                      <span>
                        {question.user?.full_name || question.guest_name || 'Customer'}
                      </span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(question.created_at))} ago</span>
                      {question.is_featured && (
                        <>
                          <span>•</span>
                          <span className="text-(--brand-primary) font-medium">Featured</span>
                        </>
                      )}
                    </div>
                  </div>
                  {question.answers.length > 0 && (
                    <button
                      onClick={() => toggleExpanded(question.id)}
                      className="flex items-center gap-1 text-sm text-(--color-text-muted) hover:text-foreground"
                    >
                      {question.answers.length} answer{question.answers.length > 1 ? 's' : ''}
                      {expandedQuestions.has(question.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Answers */}
              {(expandedQuestions.has(question.id) || question.answers.length === 1) && question.answers.length > 0 && (
                <div className="border-t bg-background p-4 space-y-4">
                  {question.answers.map((answer) => (
                    <div key={answer.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        answer.is_official ? 'bg-blue-100' : 'bg-(--color-elevated)'
                      }`}>
                        {answer.vendor ? (
                          <Store className="h-4 w-4 text-blue-600" />
                        ) : answer.is_official ? (
                          <Shield className="h-4 w-4 text-blue-600" />
                        ) : (
                          <User className="h-4 w-4 text-(--color-text-muted)" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {answer.vendor?.business_name || answer.user?.full_name || 'User'}
                          </span>
                          {answer.is_official && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {answer.vendor ? 'Seller' : 'Official'}
                            </span>
                          )}
                        </div>
                        <p className="text-(--color-text-secondary)">{answer.answer}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-(--color-text-muted)">
                          <span>{formatDistanceToNow(new Date(answer.created_at))} ago</span>
                          <button className="flex items-center gap-1 hover:text-(--brand-primary)">
                            <ThumbsUp className="h-3 w-3" />
                            Helpful ({answer.helpful_count})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Form */}
              {isLoggedIn && (
                <div className="border-t p-4 bg-(--color-surface)">
                  {answeringQuestion === question.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        placeholder="Write your answer..."
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary) text-sm resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setAnsweringQuestion(null)
                            setNewAnswer('')
                          }}
                          className="px-3 py-2.5 text-sm border rounded-lg hover:bg-background"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitAnswer(question.id)}
                          disabled={!newAnswer.trim() || submitting}
                          className="px-3 py-2.5 text-sm bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : 'Submit Answer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAnsweringQuestion(question.id)}
                      className="text-sm text-(--brand-primary) hover:text-(--brand-primary-hover) font-medium"
                    >
                      Answer this question
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 border border-(--color-border) rounded-lg hover:bg-background text-(--color-text-secondary)"
          >
            Load More Questions
          </button>
        </div>
      )}
    </div>
  )
}
