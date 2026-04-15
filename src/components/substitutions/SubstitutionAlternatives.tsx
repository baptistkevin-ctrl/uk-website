'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowLeft, Leaf, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlternativeProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  brand?: string
  unit?: string
  is_organic?: boolean
  score: number
  reasons: string[]
}

interface SubstitutionAlternativesProps {
  productId: string
  onSelect: (productId: string) => void
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Score bar
// ---------------------------------------------------------------------------

function ScoreBar({ score }: { score: number }) {
  const barColor =
    score >= 80
      ? 'bg-(--color-success)'
      : score >= 60
        ? 'bg-(--brand-amber)'
        : 'bg-(--color-error)'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--color-elevated)">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-(--color-text-secondary)">
        {score}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function AlternativeSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3">
      <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-1.5 w-full" />
      </div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubstitutionAlternatives
// ---------------------------------------------------------------------------

export function SubstitutionAlternatives({
  productId,
  onSelect,
  onCancel,
}: SubstitutionAlternativesProps) {
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectingId, setSelectingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAlternatives() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/substitutions?productId=${encodeURIComponent(productId)}`,
        )

        if (!res.ok) {
          throw new Error('Failed to load alternatives')
        }

        const data = (await res.json()) as { alternatives: AlternativeProduct[] }

        if (!cancelled) {
          const sorted = [...data.alternatives].sort(
            (a, b) => b.score - a.score,
          )
          setAlternatives(sorted.slice(0, 5))
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Something went wrong',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAlternatives()

    return () => {
      cancelled = true
    }
  }, [productId])

  function handleSelect(id: string) {
    setSelectingId(id)
    onSelect(id)
  }

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-(--shadow-md)">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--color-border) text-(--color-text-secondary) transition-colors hover:bg-(--color-elevated) hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            Alternative Options
          </h3>
          <p className="text-xs text-(--color-text-muted)">
            Choose the best substitute for your item
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2.5">
        {loading && (
          <>
            <AlternativeSkeleton />
            <AlternativeSkeleton />
            <AlternativeSkeleton />
          </>
        )}

        {error && (
          <div className="rounded-lg bg-(--color-error)/10 p-4 text-center">
            <p className="text-sm text-(--color-error)">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setLoading(true)}
            >
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && alternatives.length === 0 && (
          <div className="rounded-lg bg-(--color-elevated) p-6 text-center">
            <p className="text-sm text-(--color-text-muted)">
              No alternative products found
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          alternatives.map((alt) => (
            <div
              key={alt.id}
              className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3 transition-colors hover:bg-(--color-elevated)"
            >
              {/* Image */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-(--color-elevated)">
                {alt.image_url ? (
                  <Image
                    src={alt.image_url}
                    alt={alt.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-(--color-text-muted)">
                    N/A
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {alt.name}
                </p>

                <div className="mt-0.5 flex items-center gap-2">
                  {alt.brand && (
                    <span className="text-xs text-(--color-text-muted)">
                      {alt.brand}
                    </span>
                  )}
                  <span className="text-sm font-bold text-foreground">
                    {formatPrice(alt.price_pence)}
                  </span>
                  {alt.is_organic && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-(--color-success)">
                      <Leaf className="h-3 w-3" />
                      Organic
                    </span>
                  )}
                </div>

                {/* Score bar */}
                <div className="mt-1.5">
                  <ScoreBar score={alt.score} />
                </div>

                {/* Reasons */}
                {alt.reasons.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {alt.reasons.slice(0, 3).map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full bg-(--color-elevated) px-2 py-0.5 text-[11px] text-(--color-text-muted)"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Select button */}
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() => handleSelect(alt.id)}
                loading={selectingId === alt.id}
                disabled={selectingId !== null}
              >
                <Check className="h-3.5 w-3.5" />
                Select
              </Button>
            </div>
          ))}
      </div>

      {/* Cancel */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-(--color-text-muted) underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Cancel and remove item
        </button>
      </div>
    </div>
  )
}
