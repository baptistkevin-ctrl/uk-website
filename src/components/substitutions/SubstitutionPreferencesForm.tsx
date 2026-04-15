'use client'

import { useState, useCallback } from 'react'
import {
  Tag,
  Coins,
  Target,
  Leaf,
  Check,
  Save,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubstitutionPriority =
  | 'same_brand'
  | 'cheapest'
  | 'closest_match'
  | 'prefer_organic'

type MaxPriceIncrease = 0 | 10 | 20 | 30 | -1

interface SubstitutionPreferences {
  priority: SubstitutionPriority
  maxPriceIncrease: MaxPriceIncrease
  dietaryStrictMode: boolean
  autoAccept: boolean
  preferOrganic: boolean
}

interface SubstitutionPreferencesFormProps {
  onSave?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS: {
  value: SubstitutionPriority
  label: string
  description: string
  icon: typeof Tag
}[] = [
  {
    value: 'same_brand',
    label: 'Same Brand First',
    description: 'Prioritise products from the same brand you originally chose',
    icon: Tag,
  },
  {
    value: 'cheapest',
    label: 'Cheapest Option',
    description: 'Always suggest the most affordable alternative available',
    icon: Coins,
  },
  {
    value: 'closest_match',
    label: 'Closest Match',
    description: 'Find the product most similar in size, type, and quality',
    icon: Target,
  },
  {
    value: 'prefer_organic',
    label: 'Prefer Organic',
    description: 'Prioritise organic alternatives when available',
    icon: Leaf,
  },
]

const PRICE_INCREASE_OPTIONS: { value: MaxPriceIncrease; label: string }[] = [
  { value: 0, label: '0%' },
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
  { value: 30, label: '30%' },
  { value: -1, label: 'No limit' },
]

const DEFAULT_PREFERENCES: SubstitutionPreferences = {
  priority: 'closest_match',
  maxPriceIncrease: 10,
  dietaryStrictMode: true,
  autoAccept: false,
  preferOrganic: false,
}

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:bg-(--color-elevated)">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-muted)">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-(--brand-primary)' : 'bg-(--color-border)',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-(--color-surface) shadow-sm transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </label>
  )
}

// ---------------------------------------------------------------------------
// SubstitutionPreferencesForm
// ---------------------------------------------------------------------------

export function SubstitutionPreferencesForm({
  onSave,
}: SubstitutionPreferencesFormProps) {
  const [prefs, setPrefs] =
    useState<SubstitutionPreferences>(DEFAULT_PREFERENCES)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const updatePref = useCallback(
    <K extends keyof SubstitutionPreferences>(
      key: K,
      value: SubstitutionPreferences[K],
    ) => {
      setPrefs((prev) => ({ ...prev, [key]: value }))
      setSaved(false)
    },
    [],
  )

  async function handleSave() {
    setSaving(true)

    try {
      const res = await fetch('/api/substitutions/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })

      if (!res.ok) throw new Error('Failed to save preferences')

      setSaved(true)
      onSave?.()
    } catch {
      setSaved(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Priority */}
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">
          Substitution Priority
        </h2>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          How should we rank alternative products?
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PRIORITY_OPTIONS.map((option) => {
            const Icon = option.icon
            const selected = prefs.priority === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updatePref('priority', option.value)}
                className={cn(
                  'relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                  selected
                    ? 'border-(--brand-primary) bg-(--brand-primary)/5 shadow-(--shadow-sm)'
                    : 'border-(--color-border) bg-(--color-surface) hover:bg-(--color-elevated)',
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    selected
                      ? 'bg-(--brand-primary)/15 text-(--brand-primary)'
                      : 'bg-(--color-elevated) text-(--color-text-muted)',
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-muted)">
                    {option.description}
                  </p>
                </div>

                {selected && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-(--brand-primary) text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Max Price Increase */}
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">
          Maximum Price Increase
        </h2>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          The most you are willing to pay above the original price
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRICE_INCREASE_OPTIONS.map((option) => {
            const selected = prefs.maxPriceIncrease === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updatePref('maxPriceIncrease', option.value)}
                className={cn(
                  'rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all',
                  selected
                    ? 'border-(--brand-primary) bg-(--brand-primary)/10 text-(--brand-primary)'
                    : 'border-(--color-border) bg-(--color-surface) text-(--color-text-secondary) hover:bg-(--color-elevated)',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Toggles */}
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">
          Additional Settings
        </h2>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          Fine-tune how substitutions work for you
        </p>

        <div className="mt-4 space-y-3">
          <Toggle
            checked={prefs.dietaryStrictMode}
            onChange={(v) => updatePref('dietaryStrictMode', v)}
            label="Dietary Strict Mode"
            description="Never suggest items that violate your dietary profile. Allergens and dietary restrictions are always respected."
          />

          <Toggle
            checked={prefs.autoAccept}
            onChange={(v) => updatePref('autoAccept', v)}
            label="Auto-Accept Top Suggestion"
            description="Automatically accept the highest-scoring substitute without asking. You can still review changes in your order summary."
          />

          <Toggle
            checked={prefs.preferOrganic}
            onChange={(v) => updatePref('preferOrganic', v)}
            label="Prefer Organic"
            description="When available, prioritise organic alternatives even if they cost slightly more."
          />
        </div>
      </section>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          loading={saving}
          disabled={saved}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Preferences Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>

        {saved && (
          <span className="text-sm text-(--color-success)">
            Your preferences have been updated
          </span>
        )}
      </div>
    </div>
  )
}

export type { SubstitutionPreferences, SubstitutionPriority, MaxPriceIncrease }
