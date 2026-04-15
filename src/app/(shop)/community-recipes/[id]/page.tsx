'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronUp,
  ChevronDown,
  Clock,
  Users,
  Flame,
  Globe,
  ShoppingCart,
  Check,
  Star,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { useCommunityRecipesStore } from '@/stores/community-recipes-store'

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-(--color-success)',
  Medium: 'text-(--brand-amber)',
  Hard: 'text-(--color-error)',
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

export default function CommunityRecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    getRecipe,
    userVotes,
    upvote,
    downvote,
    getComments,
    addComment,
  } = useCommunityRecipesStore()

  const recipe = getRecipe(id)
  const comments = getComments(id)
  const vote = userVotes[id]

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set(),
  )
  const [commentText, setCommentText] = useState('')
  const [commentRating, setCommentRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)

  if (!recipe) {
    return (
      <Container size="lg" className="py-8">
        <div className="py-20 text-center">
          <h1 className="mb-2 text-2xl font-bold text-(--color-text)">
            Recipe not found
          </h1>
          <p className="mb-6 text-(--color-text-muted)">
            This recipe may have been removed or the link is invalid.
          </p>
          <Link
            href="/community-recipes"
            className="inline-flex items-center gap-2 rounded-lg bg-(--brand-amber) px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--brand-amber-hover)"
          >
            <ArrowLeft size={14} />
            Back to Community Recipes
          </Link>
        </div>
      </Container>
    )
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Community Recipes', href: '/community-recipes' },
    { label: recipe!.title },
  ]

  function toggleIngredient(idx: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  function handleSubmitComment() {
    if (!commentText.trim()) return

    addComment(recipe!.id, {
      recipeId: recipe!.id,
      authorId: 'current-user',
      authorName: 'You',
      message: commentText.trim(),
      rating: commentRating,
    })
    setCommentText('')
    setCommentRating(5)
  }

  return (
    <Container size="lg" className="py-8">
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* ── Hero ── */}
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src={recipe!.imageUrl}
            alt={recipe!.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          {/* Author */}
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--brand-amber) text-xs font-bold text-white">
              {getInitials(recipe!.authorName)}
            </span>
            <div>
              <p className="text-sm font-medium text-(--color-text)">
                {recipe!.authorName}
              </p>
              <p className="text-xs text-(--color-text-muted)">
                submitted {timeAgo(recipe!.createdAt)}
              </p>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-3 font-display text-3xl font-bold tracking-tight text-(--color-text)">
            {recipe!.title}
          </h1>
          <p className="mb-5 text-(--color-text-secondary)">
            {recipe!.description}
          </p>

          {/* Stats grid */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBadge
              icon={<Clock size={14} />}
              label="Prep"
              value={`${recipe!.prepTime} min`}
            />
            <StatBadge
              icon={<Flame size={14} />}
              label="Cook"
              value={`${recipe!.cookTime} min`}
            />
            <StatBadge
              icon={<Users size={14} />}
              label="Servings"
              value={String(recipe!.servings)}
            />
            <StatBadge
              icon={<Globe size={14} />}
              label="Cuisine"
              value={recipe!.cuisine}
            />
          </div>

          {/* Difficulty */}
          <p className="mb-4 text-sm">
            <span className="text-(--color-text-secondary)">Difficulty: </span>
            <span className={cn('font-semibold', DIFFICULTY_COLORS[recipe!.difficulty])}>
              {recipe!.difficulty}
            </span>
          </p>

          {/* Vote buttons */}
          <div className="mb-5 flex items-center gap-3">
            <button
              onClick={() => upvote(recipe!.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
                vote === 'up'
                  ? 'border-(--color-success) bg-(--color-success)/10 text-(--color-success)'
                  : 'border-(--color-border) text-(--color-text-secondary) hover:border-(--color-success) hover:text-(--color-success)',
              )}
            >
              <ChevronUp size={18} />
              {recipe!.upvotes}
            </button>

            <button
              onClick={() => downvote(recipe!.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
                vote === 'down'
                  ? 'border-(--color-error) bg-(--color-error)/10 text-(--color-error)'
                  : 'border-(--color-border) text-(--color-text-secondary) hover:border-(--color-error) hover:text-(--color-error)',
              )}
            >
              <ChevronDown size={18} />
              {recipe!.downvotes}
            </button>
          </div>

          {/* Dietary tags */}
          {recipe!.dietary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe!.dietary.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-(--color-elevated) px-3 py-1 text-xs font-medium text-(--color-text-secondary)"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Ingredients ── */}
      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-(--color-text)">
            Ingredients
          </h2>
          <button className="inline-flex items-center gap-2 rounded-lg bg-(--brand-amber) px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--brand-amber-hover)">
            <ShoppingCart size={14} />
            Add All Ingredients
          </button>
        </div>

        <ul className="space-y-2">
          {recipe!.ingredients.map((ing, idx) => (
            <li key={idx}>
              <button
                onClick={() => toggleIngredient(idx)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                  checkedIngredients.has(idx)
                    ? 'border-(--color-success)/30 bg-(--color-success)/5 line-through opacity-60'
                    : 'border-(--color-border) bg-(--color-surface) hover:bg-(--color-elevated)',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                    checkedIngredients.has(idx)
                      ? 'border-(--color-success) bg-(--color-success) text-white'
                      : 'border-(--color-border)',
                  )}
                >
                  {checkedIngredients.has(idx) && <Check size={12} />}
                </span>
                <span className="font-medium text-(--color-text)">
                  {ing.name}
                </span>
                <span className="ml-auto text-(--color-text-muted)">
                  {ing.quantity} {ing.unit}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Steps ── */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-(--color-text)">
          Method
        </h2>
        <ol className="space-y-4">
          {recipe!.steps.map((step, idx) => (
            <li key={idx} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--brand-amber) text-sm font-bold text-white">
                {idx + 1}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-(--color-text-secondary)">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Tips ── */}
      {recipe!.tips.length > 0 && (
        <section className="mb-10 rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="mb-3 text-lg font-semibold text-(--color-text)">
            Tips
          </h3>
          <ul className="space-y-2">
            {recipe!.tips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-(--color-text-secondary)"
              >
                <span className="mt-0.5 text-(--brand-amber)">*</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Comments ── */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-(--color-text)">
          <MessageCircle size={20} />
          Community Reviews
          <span className="text-sm font-normal text-(--color-text-muted)">
            ({comments.length})
          </span>
        </h3>

        {/* Comment form */}
        <div className="mb-6 rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
          {/* Star rating */}
          <div className="mb-3 flex items-center gap-1">
            <span className="mr-2 text-sm text-(--color-text-secondary)">
              Your rating:
            </span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setCommentRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-colors"
              >
                <Star
                  size={20}
                  className={cn(
                    (hoverRating || commentRating) >= star
                      ? 'fill-(--brand-amber) text-(--brand-amber)'
                      : 'text-(--color-border)',
                  )}
                />
              </button>
            ))}
          </div>

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts on this recipe!..."
            rows={3}
            className="mb-3 w-full resize-none rounded-lg border border-(--color-border) bg-(--color-bg) p-3 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:border-(--brand-amber) focus:outline-none"
          />

          <button
            onClick={handleSubmitComment}
            disabled={!commentText.trim()}
            className="rounded-lg bg-(--brand-amber) px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--brand-amber-hover) disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post Review
          </button>
        </div>

        {/* Comment list */}
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-(--color-text-muted)">
            No reviews yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--brand-primary) text-[11px] font-bold text-white">
                      {getInitials(comment.authorName)}
                    </span>
                    <span className="text-sm font-medium text-(--color-text)">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-(--color-text-muted)">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={cn(
                          i < comment.rating
                            ? 'fill-(--brand-amber) text-(--brand-amber)'
                            : 'text-(--color-border)',
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-(--color-text-secondary)">
                  {comment.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Container>
  )
}

/* ──────────────────────────────────────────────
   Stat Badge
   ────────────────────────────────────────────── */

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2">
      <span className="text-(--brand-amber)">{icon}</span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-(--color-text-muted)">
          {label}
        </p>
        <p className="text-sm font-semibold text-(--color-text)">{value}</p>
      </div>
    </div>
  )
}
