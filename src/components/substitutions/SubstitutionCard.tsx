'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  AlertCircle,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Leaf,
  Check,
  X,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OriginalProduct {
  name: string
  image_url: string | null
  price_pence: number
  brand?: string
}

interface SubstitutionProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  brand?: string
  unit?: string
  is_organic?: boolean
}

interface Substitution {
  product: SubstitutionProduct
  score: number
  reasons: string[]
  priceChange: number
  priceChangePercent: number
}

interface SubstitutionCardProps {
  originalProduct: OriginalProduct
  substitution: Substitution
  onAccept: (productId: string) => void
  onReject: () => void
  onViewAlternatives: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-(--color-success)'
  if (score >= 60) return 'text-(--brand-amber)'
  return 'text-(--color-error)'
}

function getScoreTrackColor(score: number): string {
  if (score >= 80) return 'stroke-(--color-success)'
  if (score >= 60) return 'stroke-(--brand-amber)'
  return 'stroke-(--color-error)'
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-(--color-success)/10'
  if (score >= 60) return 'bg-(--brand-amber)/10'
  return 'bg-(--color-error)/10'
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg
        className="-rotate-90"
        width={48}
        height={48}
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <circle
          cx={24}
          cy={24}
          r={radius}
          fill="none"
          strokeWidth={3}
          className="stroke-(--color-border)"
        />
        <circle
          cx={24}
          cy={24}
          r={radius}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={getScoreTrackColor(score)}
        />
      </svg>
      <span
        className={cn(
          'absolute text-xs font-bold',
          getScoreColor(score),
        )}
      >
        {score}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Price Comparison
// ---------------------------------------------------------------------------

function PriceComparison({
  priceChange,
  priceChangePercent,
}: {
  priceChange: number
  priceChangePercent: number
}) {
  if (priceChange === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-(--color-success)">
        <Check className="h-3.5 w-3.5" />
        Same price
      </span>
    )
  }

  if (priceChange < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-(--color-success)">
        <ArrowDown className="h-3.5 w-3.5" />
        {formatPrice(Math.abs(priceChange))} cheaper
        <span className="text-(--color-text-muted)">
          ({Math.abs(priceChangePercent).toFixed(0)}%)
        </span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-(--brand-amber)">
      <ArrowUp className="h-3.5 w-3.5" />
      {formatPrice(priceChange)} more
      <span className="text-(--color-text-muted)">
        (+{priceChangePercent.toFixed(0)}%)
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// SubstitutionCard
// ---------------------------------------------------------------------------

export function SubstitutionCard({
  originalProduct,
  substitution,
  onAccept,
  onReject,
  onViewAlternatives,
}: SubstitutionCardProps) {
  const [accepting, setAccepting] = useState(false)
  const sub = substitution.product

  function handleAccept() {
    setAccepting(true)
    onAccept(sub.id)
  }

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-(--shadow-md)">
      {/* Unavailable banner */}
      <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-(--color-warning)/10 p-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-(--color-warning)" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            This item is unavailable
          </p>
          <p className="mt-0.5 truncate text-xs text-(--color-text-muted)">
            {originalProduct.name}
          </p>
        </div>
      </div>

      {/* Comparison columns */}
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Original (grayed out) */}
        <div className="flex flex-col items-center gap-2 opacity-50">
          <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-(--color-elevated)">
            {originalProduct.image_url ? (
              <Image
                src={originalProduct.image_url}
                alt={originalProduct.name}
                fill
                className="object-cover grayscale"
                sizes="56px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-(--color-text-muted)">
                N/A
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <X className="h-6 w-6 text-(--color-error)" />
            </div>
          </div>
          <div className="text-center">
            <p className="line-through text-xs text-(--color-text-muted) line-clamp-2">
              {originalProduct.name}
            </p>
            <p className="mt-0.5 text-xs text-(--color-text-muted) line-through">
              {formatPrice(originalProduct.price_pence)}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-elevated)">
          <ArrowRight className="h-4 w-4 text-(--color-text-secondary)" />
        </div>

        {/* Suggested substitute */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-(--color-elevated) ring-2 ring-(--brand-primary)/30">
            {sub.image_url ? (
              <Image
                src={sub.image_url}
                alt={sub.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-(--color-text-muted)">
                No image
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground line-clamp-2">
              {sub.name}
            </p>
            {(sub.brand || sub.unit) && (
              <p className="mt-0.5 text-xs text-(--color-text-muted)">
                {[sub.brand, sub.unit].filter(Boolean).join(' | ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Score + price row */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ScoreCircle score={substitution.score} />
          <div>
            <p className="text-xs font-medium text-(--color-text-secondary)">
              Match score
            </p>
            <p className="text-sm font-bold text-foreground">
              {formatPrice(sub.price_pence)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <PriceComparison
            priceChange={substitution.priceChange}
            priceChangePercent={substitution.priceChangePercent}
          />
          {sub.is_organic && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-(--color-success)/10 px-2 py-0.5 text-xs font-medium text-(--color-success)">
              <Leaf className="h-3 w-3" />
              Organic
            </span>
          )}
        </div>
      </div>

      {/* Reason pills */}
      {substitution.reasons.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {substitution.reasons.map((reason) => (
            <span
              key={reason}
              className="rounded-full bg-(--color-elevated) px-3 py-2.5 text-xs text-(--color-text-secondary)"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        <Button
          variant="secondary"
          size="md"
          className="w-full"
          onClick={handleAccept}
          loading={accepting}
        >
          <Check className="h-4 w-4" />
          Accept Substitute
        </Button>

        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={onViewAlternatives}
        >
          <Eye className="h-4 w-4" />
          View Other Options
        </Button>

        <button
          type="button"
          onClick={onReject}
          className="mx-auto block text-xs text-(--color-text-muted) underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Remove Item
        </button>
      </div>
    </div>
  )
}
