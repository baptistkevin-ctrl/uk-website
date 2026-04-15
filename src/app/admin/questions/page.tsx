'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageCircleQuestion,
  Check,
  X,
  Eye,
  Trash2,
  Loader2,
  Search,
  Filter,
  Star,
  MessageSquare
} from 'lucide-react'

interface Question {
  id: string
  question: string
  status: string
  is_featured: boolean
  created_at: string
  product: { id: string; name: string; slug: string; image_url: string | null }
  user: { id: string; full_name: string; email: string } | null
  guest_name: string | null
  guest_email: string | null
  answers: { id: string }[]
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [statusFilter])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/questions?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (res.ok) {
        fetchQuestions()
      }
    } catch (error) {
      console.error('Failed to update question:', error)
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return

    try {
      await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
      fetchQuestions()
    } catch (error) {
      console.error('Failed to delete question:', error)
    }
  }

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageCircleQuestion className="h-7 w-7 text-(--brand-primary)" />
              Product Q&A
            </h1>
            <p className="text-(--color-text-muted) mt-1">
              Manage customer questions and answers
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex bg-(--color-elevated) rounded-lg p-1">
            {['pending', 'approved', 'answered', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-(--color-surface) shadow text-foreground'
                    : 'text-(--color-text-secondary) hover:text-foreground'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
            />
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-background rounded-xl">
            <MessageCircleQuestion className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
            <p className="text-(--color-text-muted)">No questions found</p>
          </div>
        ) : (
          <div className="bg-(--color-surface) rounded-xl shadow-sm border border-(--color-border) overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Question
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Product
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Customer
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Answers
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-background">
                    <td className="px-6 py-4">
                      <p className="text-foreground line-clamp-2">{question.question}</p>
                      <p className="text-xs text-(--color-text-muted) mt-1">
                        {formatDistanceToNow(new Date(question.created_at))} ago
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground line-clamp-1">
                        {question.product.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">
                        {question.user?.full_name || question.guest_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">
                        {question.user?.email || question.guest_email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary)">
                        <MessageSquare className="h-4 w-4" />
                        {question.answers.length}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {question.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateQuestion(question.id, { status: 'approved' })}
                              className="p-1.5 text-(--brand-primary) hover:bg-(--brand-primary-light) rounded"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateQuestion(question.id, { status: 'rejected' })}
                              className="p-1.5 text-(--color-error) hover:bg-(--color-error-bg) rounded"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => updateQuestion(question.id, { is_featured: !question.is_featured })}
                          className={`p-1.5 rounded ${
                            question.is_featured
                              ? 'text-(--brand-amber) bg-(--brand-amber-soft)'
                              : 'text-(--color-text-disabled) hover:bg-(--color-elevated)'
                          }`}
                          title="Feature"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="p-1.5 text-(--color-text-disabled) hover:text-(--color-error) hover:bg-(--color-error-bg) rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
