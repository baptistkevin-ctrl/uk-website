'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Save } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  usePickerChatStore,
  
} from '@/stores/picker-chat-store'

/* ── Types ── */

interface OrderItem {
  productId: string
  productName: string
  productImage?: string
}

interface PickerPreferencesFormProps {
  orderId: string
  items: OrderItem[]
}

/* ── Substitution options ── */

const SUBSTITUTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'accept', label: 'Accept a similar product' },
  { value: 'contact', label: 'Contact me first' },
  { value: 'remove', label: 'Just remove from order' },
]

/* ── Component ── */

export default function PickerPreferencesForm({
  orderId,
  items,
}: PickerPreferencesFormProps) {
  const { preferences, generalNote, setPreference, setGeneralNote } =
    usePickerChatStore()

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)

  const toggleItem = useCallback((productId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await fetch(`/api/orders/${orderId}/picker-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, generalNote }),
      })
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 2_500)
    } catch {
      /* silently fail — user can retry */
    } finally {
      setIsSaving(false)
    }
  }, [orderId, preferences, generalNote])

  return (
    <div
      className={cn(
        'rounded-xl border border-(--color-border)',
        'bg-(--color-surface) p-5',
      )}
    >
      {/* ── Title ── */}
      <h3 className="text-lg font-semibold text-(--color-text)">
        Picking Preferences
      </h3>
      <p className="mt-1 text-sm text-(--color-text-secondary)">
        Tell your shopper how to pick your items
      </p>

      {/* ── General note ── */}
      <div className="mt-5">
        <label
          htmlFor="general-note"
          className="block text-sm font-medium text-(--color-text) mb-1.5"
        >
          Any special instructions for your shopper?
        </label>
        <textarea
          id="general-note"
          value={generalNote}
          onChange={(e) => setGeneralNote(e.target.value)}
          placeholder="e.g., Ring the bell, leave with neighbour..."
          rows={3}
          className={cn(
            'w-full rounded-lg border border-(--color-border)',
            'bg-(--color-surface) px-3 py-2 text-sm',
            'text-(--color-text) placeholder:text-(--color-text-muted)',
            'outline-none focus:ring-2 focus:ring-(--brand-primary)/30',
            'resize-none transition-shadow',
          )}
        />
      </div>

      {/* ── Per-item list ── */}
      <div className="mt-5 space-y-2">
        {items.map((item) => {
          const isExpanded = expandedItems.has(item.productId)
          const pref = (preferences.find((p: any) => p.productId === item.productId))

          return (
            <div
              key={item.productId}
              className={cn(
                'rounded-lg border border-(--color-border)',
                'overflow-hidden transition-colors',
                isExpanded && 'bg-(--color-elevated)',
              )}
            >
              {/* Item header */}
              <button
                type="button"
                onClick={() => toggleItem(item.productId)}
                className={cn(
                  'flex w-full items-center gap-3 p-3',
                  'hover:bg-(--color-elevated) transition-colors',
                  'cursor-pointer text-left',
                )}
              >
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-10 w-10 shrink-0 rounded-sm object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-(--color-elevated) text-(--color-text-muted) text-xs">
                    N/A
                  </div>
                )}

                <span className="flex-1 text-sm font-medium text-(--color-text) truncate">
                  {item.productName}
                </span>

                {pref?.note && (
                  <span className="shrink-0 rounded-full bg-(--brand-primary-light) px-2 py-0.5 text-[11px] font-medium text-(--brand-primary)">
                    Note added
                  </span>
                )}

                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-(--color-border) p-3 space-y-3">
                  {/* Note */}
                  <div>
                    <label
                      htmlFor={`note-${item.productId}`}
                      className="block text-xs font-medium text-(--color-text-secondary) mb-1"
                    >
                      How should we pick this?
                    </label>
                    <input
                      id={`note-${item.productId}`}
                      type="text"
                      value={pref?.note ?? ''}
                      onChange={(e) =>
                        setPreference({ productId: item.productId, productName: item.productName, note: e.target.value, substitutionPref: pref?.substitutionPref ?? 'accept_similar' })
                      }
                      placeholder="Pick firm ones, Prefer ripe, Large size..."
                      className={cn(
                        'w-full h-9 rounded-lg border border-(--color-border)',
                        'bg-(--color-surface) px-3 text-sm',
                        'text-(--color-text) placeholder:text-(--color-text-muted)',
                        'outline-none focus:ring-2 focus:ring-(--brand-primary)/30',
                        'transition-shadow',
                      )}
                    />
                  </div>

                  {/* Substitution preference */}
                  <fieldset>
                    <legend className="text-xs font-medium text-(--color-text-secondary) mb-1.5">
                      If this item is unavailable:
                    </legend>
                    <div className="space-y-1.5">
                      {SUBSTITUTION_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-3 py-2',
                            'cursor-pointer transition-colors',
                            'hover:bg-(--color-surface)',
                            (pref?.substitutionPref ?? 'accept') ===
                              opt.value && 'bg-(--color-surface) ring-1 ring-(--brand-primary)/30',
                          )}
                        >
                          <input
                            type="radio"
                            name={`sub-${item.productId}`}
                            value={opt.value}
                            checked={
                              (pref?.substitutionPref ?? 'accept') ===
                              opt.value
                            }
                            onChange={() =>
                              setPreference({
                                productId: item.productId,
                                productName: item.productName,
                                note: pref?.note ?? '',
                                substitutionPref: opt.value as 'accept_similar' | 'contact_me' | 'remove_item',
                              })
                            }
                            className="accent-(--brand-primary)"
                          />
                          <span className="text-xs text-(--color-text)">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Save button ── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className={cn(
          'mt-5 flex w-full items-center justify-center gap-2',
          'h-11 rounded-lg',
          'text-sm font-semibold text-white',
          'transition-all cursor-pointer',
          savedFeedback
            ? 'bg-(--color-success)'
            : 'bg-(--brand-amber) hover:bg-(--brand-amber-hover)',
          isSaving && 'opacity-60 cursor-not-allowed',
        )}
      >
        <Save className="h-4 w-4" />
        {isSaving
          ? 'Saving...'
          : savedFeedback
            ? 'Preferences saved!'
            : 'Save Preferences'}
      </button>
    </div>
  )
}
