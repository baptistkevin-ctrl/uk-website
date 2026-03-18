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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircleQuestion className="h-6 w-6 text-emerald-600" />
          Customer Questions & Answers
          {questions.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({questions.length})
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Ask a Question
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Question Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Ask about this product</h3>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What would you like to know about this product?"
            rows={3}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />

          {!isLoggedIn && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name (optional)"
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Your email (for notifications)"
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submitQuestion}
              disabled={!newQuestion.trim() || submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
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
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <MessageCircleQuestion className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className={`border rounded-xl overflow-hidden ${
                question.is_featured ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'
              }`}
            >
              {/* Question */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 font-bold text-sm">Q</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{question.question}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span>
                        {question.user?.full_name || question.guest_name || 'Customer'}
                      </span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(question.created_at))} ago</span>
                      {question.is_featured && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">Featured</span>
                        </>
                      )}
                    </div>
                  </div>
                  {question.answers.length > 0 && (
                    <button
                      onClick={() => toggleExpanded(question.id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
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
                <div className="border-t bg-gray-50 p-4 space-y-4">
                  {question.answers.map((answer) => (
                    <div key={answer.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        answer.is_official ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {answer.vendor ? (
                          <Store className="h-4 w-4 text-blue-600" />
                        ) : answer.is_official ? (
                          <Shield className="h-4 w-4 text-blue-600" />
                        ) : (
                          <User className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {answer.vendor?.business_name || answer.user?.full_name || 'User'}
                          </span>
                          {answer.is_official && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {answer.vendor ? 'Seller' : 'Official'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{answer.answer}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span>{formatDistanceToNow(new Date(answer.created_at))} ago</span>
                          <button className="flex items-center gap-1 hover:text-emerald-600">
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
                <div className="border-t p-4 bg-white">
                  {answeringQuestion === question.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        placeholder="Write your answer..."
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setAnsweringQuestion(null)
                            setNewAnswer('')
                          }}
                          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitAnswer(question.id)}
                          disabled={!newAnswer.trim() || submitting}
                          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : 'Submit Answer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAnsweringQuestion(question.id)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
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
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Load More Questions
          </button>
        </div>
      )}
    </div>
  )
}
