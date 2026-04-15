'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Badge } from '@/lib/loyalty/gamification-engine'

interface LoyaltyBadgeProps {
  badge: Badge
  unlocked: boolean
  progress?: number
  compact?: boolean
}

const RARITY_STYLES: Record<Badge['rarity'], string> = {
  common: 'border-(--color-border)',
  rare: 'border-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.25)]',
  epic: 'border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
  legendary: 'border-amber-400/60 shadow-[0_0_16px_rgba(245,158,11,0.35)] animate-pulse',
}

const RARITY_LABELS: Record<Badge['rarity'], string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

export function LoyaltyBadge({ badge, unlocked, progress = 0, compact = false }: LoyaltyBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const progressPercent = Math.min(
    Math.round((progress / badge.threshold) * 100),
    100
  )

  if (compact) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full border-2 text-lg transition-all',
            unlocked
              ? RARITY_STYLES[badge.rarity]
              : 'border-(--color-border) opacity-50 grayscale'
          )}
        >
          {unlocked ? badge.icon : <Lock className="w-3.5 h-3.5 text-(--color-text-muted)" />}
        </div>

        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
            <div className="bg-(--color-elevated) border border-(--color-border) rounded-lg px-3 py-2 shadow-(--shadow-(--shadow-lg)) whitespace-nowrap text-center">
              <p className="text-xs font-semibold text-(--color-text)">{badge.name}</p>
              <p className="text-[11px] text-(--color-text-muted)">+{badge.xpReward} XP</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
          'hover:scale-105',
          unlocked
            ? RARITY_STYLES[badge.rarity]
            : 'border-(--color-border) opacity-50 grayscale'
        )}
      >
        {/* Badge icon */}
        <div className="relative">
          <span className="text-3xl leading-none select-none" role="img" aria-label={badge.name}>
            {badge.icon}
          </span>
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-4 h-4 text-(--color-text-muted) drop-shadow-md" />
            </div>
          )}
        </div>

        {/* Name */}
        <p className="text-[11px] font-semibold text-(--color-text) text-center leading-tight line-clamp-2">
          {badge.name}
        </p>

        {/* Progress bar for locked badges */}
        {!unlocked && progress > 0 && (
          <div className="w-full mt-0.5">
            <div className="h-1 w-full rounded-full bg-(--color-border) overflow-hidden">
              <div
                className="h-full rounded-full bg-(--brand-primary) transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-(--color-text-muted) text-center mt-0.5">
              {progressPercent}%
            </p>
          </div>
        )}

        {/* XP badge */}
        {unlocked && (
          <span className="text-[11px] font-medium text-(--brand-primary) bg-(--brand-primary)/10 px-1.5 py-0.5 rounded-full">
            +{badge.xpReward} XP
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-(--color-elevated) border border-(--color-border) rounded-lg px-4 py-3 shadow-(--shadow-(--shadow-lg)) min-w-[180px] text-center">
            <p className="text-sm font-bold text-(--color-text)">{badge.name}</p>
            <p className="text-xs text-(--color-text-secondary) mt-1">{badge.description}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[11px] font-medium text-(--brand-primary)">+{badge.xpReward} XP</span>
              <span className="text-[11px] text-(--color-text-muted)">
                {RARITY_LABELS[badge.rarity]}
              </span>
            </div>
            {!unlocked && (
              <p className="text-[11px] text-(--color-text-muted) mt-1">
                {badge.requirement} needed
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
