'use client'

import { cn } from '@/lib/utils'
import { Heart } from 'lucide-react'
import { CHARITIES } from '@/lib/loyalty/gamification-engine'
import { useLoyaltyGameStore } from '@/stores/loyalty-store'

interface CharityRoundUpProps {
  orderTotal: number
  onToggle: (enabled: boolean) => void
  onSelectCharity: (id: string) => void
}

export function CharityRoundUp({ orderTotal, onToggle, onSelectCharity }: CharityRoundUpProps) {
  const { roundUpEnabled, selectedCharity, charities } = useLoyaltyGameStore()

  const availableCharities = charities.length > 0 ? charities : CHARITIES

  const roundedUp = Math.ceil(orderTotal / 100) * 100
  const donationPence = roundedUp - orderTotal
  const orderDisplay = (orderTotal / 100).toFixed(2)
  const roundedUpDisplay = (roundedUp / 100).toFixed(2)

  const selectedCharityData = availableCharities.find((c) => c.id === selectedCharity)

  function handleToggle() {
    onToggle(!roundUpEnabled)
  }

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/10 shrink-0">
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-(--color-text) truncate">
              Round up &pound;{orderDisplay} to &pound;{roundedUpDisplay}
            </p>
            <p className="text-xs text-(--color-text-muted)">
              Donate {donationPence}p to {selectedCharityData?.name ?? 'charity'}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={roundUpEnabled}
          onClick={handleToggle}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            roundUpEnabled ? 'bg-(--color-success)' : 'bg-(--color-border)'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-(--color-surface) shadow-sm transition-transform',
              roundUpEnabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Charity selector — only visible when enabled */}
      {roundUpEnabled && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {availableCharities.map((charity) => (
            <button
              key={charity.id}
              type="button"
              onClick={() => onSelectCharity(charity.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all',
                selectedCharity === charity.id
                  ? 'border-(--brand-primary) bg-(--brand-primary)/10 text-(--brand-primary)'
                  : 'border-(--color-border) text-(--color-text-secondary) hover:border-(--color-text-muted)'
              )}
            >
              <span>{charity.icon}</span>
              {charity.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
