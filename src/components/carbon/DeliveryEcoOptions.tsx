'use client'

import { Bike, Zap, Truck, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

type DeliveryMethod = 'cargo-bike' | 'electric-van' | 'standard-van' | 'click-collect'

interface DeliveryOption {
  id: DeliveryMethod
  name: string
  icon: React.ElementType
  co2Grams: number
  priceDiff: string
  timeEstimate: string
  description: string
}

interface DeliveryEcoOptionsProps {
  onSelect: (method: string) => void
  selected: string
  estimatedMiles?: number
  className?: string
}

function buildOptions(miles: number): DeliveryOption[] {
  return [
    {
      id: 'cargo-bike',
      name: 'Cargo Bike',
      icon: Bike,
      co2Grams: 0,
      priceDiff: 'Free',
      timeEstimate: '2-4 hours',
      description: 'Zero emissions, may be slower',
    },
    {
      id: 'electric-van',
      name: 'Electric Van',
      icon: Zap,
      co2Grams: Math.round(miles * 50),
      priceDiff: '+\u00a31.50',
      timeEstimate: '1-2 hours',
      description: 'Zero tailpipe emissions',
    },
    {
      id: 'standard-van',
      name: 'Standard Van',
      icon: Truck,
      co2Grams: Math.round(miles * 210),
      priceDiff: '+\u00a32.50',
      timeEstimate: '1-2 hours',
      description: 'Traditional delivery',
    },
    {
      id: 'click-collect',
      name: 'Click & Collect',
      icon: Store,
      co2Grams: 0,
      priceDiff: 'Free',
      timeEstimate: 'Ready in 1 hour',
      description: 'Pick up in store',
    },
  ]
}

function formatGrams(grams: number): string {
  if (grams === 0) return '0g CO\u2082'
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)}kg CO\u2082`
  return `${grams}g CO\u2082`
}

export function DeliveryEcoOptions({
  onSelect,
  selected,
  estimatedMiles = 5,
  className,
}: DeliveryEcoOptionsProps) {
  const options = buildOptions(estimatedMiles)
  const standardCo2 =
    options.find((o) => o.id === 'standard-van')?.co2Grams ?? 0

  const selectedOption = options.find((o) => o.id === selected)
  const savings =
    selectedOption && selected !== 'standard-van'
      ? standardCo2 - selectedOption.co2Grams
      : 0

  return (
    <div className={cn('space-y-3', className)}>
      <fieldset>
        <legend className="text-sm font-semibold text-(--color-text)">
          Delivery Method
        </legend>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selected === option.id
            const Icon = option.icon

            return (
              <label
                key={option.id}
                className={cn(
                  'relative flex cursor-pointer gap-3 rounded-xl border p-3 transition-all',
                  isSelected
                    ? 'border-(--brand-primary) bg-(--brand-primary)/5 shadow-(--shadow-sm)'
                    : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-text-muted)'
                )}
              >
                <input
                  type="radio"
                  name="delivery-method"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onSelect(option.id)}
                  className="sr-only"
                />

                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    isSelected
                      ? 'bg-(--brand-primary) text-white'
                      : 'bg-(--color-elevated) text-(--color-text-secondary)'
                  )}
                >
                  <Icon size={20} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-(--color-text)">
                      {option.name}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        option.co2Grams === 0
                          ? 'text-(--color-success)'
                          : 'text-(--color-text-muted)'
                      )}
                    >
                      {formatGrams(option.co2Grams)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-(--color-text-muted)">
                    {option.description}
                  </p>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-(--color-text-secondary)">
                      {option.timeEstimate}
                    </span>
                    <span className="font-medium text-(--color-text-secondary)">
                      {option.priceDiff}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-(--brand-primary)" />
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      {savings > 0 && (
        <p className="rounded-lg bg-(--color-success)/10 px-3 py-2.5 text-xs font-medium text-(--color-success)">
          You save {formatGrams(savings)} vs standard delivery
        </p>
      )}
    </div>
  )
}

export type { DeliveryEcoOptionsProps, DeliveryMethod }
