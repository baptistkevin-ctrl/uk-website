'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Flame,
  Trophy,
  Target,
  Heart,
  TrendingUp,
  Sparkles,
  Check,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoyaltyGameStore } from '@/stores/loyalty-store'
import {
  BADGES,
  CHARITIES,
  LOYALTY_LEVELS,
  getActiveChallenges,
  getLevelForXp,
  getXpProgress,
} from '@/lib/loyalty/gamification-engine'
import type { Badge, Challenge } from '@/lib/loyalty/gamification-engine'
import { LoyaltyBadge } from '@/components/loyalty/LoyaltyBadge'

/* ─────────────────────────────── Helpers ────────────────────────────── */

const LEVEL_GRADIENTS: Record<string, string> = {
  gray: 'from-zinc-600 to-zinc-500',
  amber: 'from-amber-700 to-amber-500',
  slate: 'from-slate-500 to-slate-400',
  yellow: 'from-amber-500 to-yellow-400',
  purple: 'from-purple-600 to-violet-500',
}

const CHALLENGE_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  weekly: { label: 'Weekly', className: 'bg-(--color-success)/10 text-(--color-success)' },
  monthly: { label: 'Monthly', className: 'bg-(--color-info)/10 text-(--color-info)' },
  seasonal: { label: 'Seasonal', className: 'bg-(--brand-amber)/10 text-(--brand-amber)' },
}

type BadgeCategory = Badge['category'] | 'all'

const BADGE_CATEGORIES: { value: BadgeCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'eco', label: 'Eco' },
  { value: 'social', label: 'Social' },
  { value: 'explorer', label: 'Explorer' },
  { value: 'loyalty', label: 'Loyalty' },
]

function formatXpNumber(n: number): string {
  return n.toLocaleString('en-GB')
}

/* ─────────────────────────────── Page ───────────────────────────────── */

export default function LoyaltyPage() {
  const store = useLoyaltyGameStore()
  const [badgeFilter, setBadgeFilter] = useState<BadgeCategory>('all')

  useEffect(() => {
    store.fetchGamificationState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentLevel = store.level ?? getLevelForXp(store.xp)
  const xpProgress = store.xpProgress.percentage > 0
    ? store.xpProgress
    : getXpProgress(store.xp)

  const nextLevel = LOYALTY_LEVELS.find((l) => l.minXp > currentLevel.minXp)
  const gradient = LEVEL_GRADIENTS[currentLevel.color] ?? LEVEL_GRADIENTS.gray

  // Map badge store data
  const unlockedBadgeIds = useMemo(() => {
    return new Set(
      store.badges
        .filter((b) => b.unlockedAt !== null)
        .map((b) => b.badge.id)
    )
  }, [store.badges])

  const badgeProgressMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of store.badges) {
      if (b.unlockedAt === null) {
        map[b.badge.id] = b.progress
      }
    }
    return map
  }, [store.badges])

  // Use store badges if populated, else fall back to BADGES constant
  const allBadges = useMemo(() => {
    if (store.badges.length > 0) {
      return store.badges.map((b) => b.badge)
    }
    return BADGES
  }, [store.badges])

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'all') return allBadges
    return allBadges.filter((b) => b.category === badgeFilter)
  }, [allBadges, badgeFilter])

  const unlockedCount = unlockedBadgeIds.size
  const totalBadgeCount = allBadges.length

  // Challenges
  const challenges: Array<{ challenge: Challenge; progress: number; completed: boolean }> = useMemo(() => {
    if (store.challenges.length > 0) {
      return store.challenges
    }
    const active = getActiveChallenges()
    return active.map((c) => ({ challenge: c, progress: 0, completed: false }))
  }, [store.challenges])

  // Streak
  const streak = store.streak
  const streakHistory = useMemo(() => {
    // Build a 12-week visual history
    // If the store doesn't have enough data, fill with empty
    const history: boolean[] = []
    for (let i = 0; i < 12; i++) {
      history.push(i < streak.current)
    }
    return history.reverse()
  }, [streak.current])

  // Charities
  const availableCharities = store.charities.length > 0 ? store.charities : CHARITIES

  // XP History — derive from challenges/badges or use mock
  const xpHistory = useMemo(() => {
    // The store doesn't have xpHistory in the new shape, so provide sample data
    return [
      { id: '1', reason: 'Placed order', xp: 25 },
      { id: '2', reason: "Unlocked 'Eco Warrior'", xp: 200 },
      { id: '3', reason: 'Weekly challenge complete', xp: 30 },
      { id: '4', reason: 'Left a product review', xp: 15 },
      { id: '5', reason: 'Referred a friend', xp: 100 },
    ]
  }, [])

  /* ── Loading skeleton ─────────────────────────────────────────────── */
  if (store.isLoading && store.badges.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-8 lg:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-5 w-48 rounded bg-(--color-border)" />
          <div className="h-48 rounded-2xl bg-(--color-border)" />
          <div className="h-36 rounded-xl bg-(--color-border)" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-(--color-border)" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-(--color-text-muted)">
        <Link href="/" className="hover:text-(--color-text) transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/account" className="hover:text-(--color-text) transition-colors">Account</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-(--color-text) font-medium">Rewards &amp; Achievements</span>
      </nav>

      {/* ─── 1. Hero Banner — Level & XP ─────────────────────────────── */}
      <section
        className={cn(
          'relative rounded-2xl overflow-hidden text-white',
          'bg-gradient-to-br', gradient,
        )}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 lg:p-10">
          {/* Left: Level info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-5xl" role="img" aria-label={currentLevel.name}>
                {currentLevel.name === 'Newcomer' ? '🌟' :
                 currentLevel.name === 'Bronze' ? '🥉' :
                 currentLevel.name === 'Silver' ? '🥈' :
                 currentLevel.name === 'Gold' ? '🥇' :
                 currentLevel.name === 'Platinum' ? '💎' : '⭐'}
              </span>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  {currentLevel.name}
                </h1>
                <p className="text-white/80 text-sm mt-0.5">
                  Level {currentLevel.level} &middot; {formatXpNumber(store.xp)} XP
                </p>
              </div>
            </div>

            {/* Perks */}
            <div className="flex flex-wrap gap-2">
              {currentLevel.perks.map((perk) => (
                <span
                  key={perk}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm"
                >
                  <Check className="w-3 h-3" />
                  {perk}
                </span>
              ))}
            </div>
          </div>

          {/* Right: XP progress */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            {/* Circular progress ring */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - xpProgress.percentage / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{xpProgress.percentage}%</span>
              </div>
            </div>

            {nextLevel ? (
              <p className="text-sm text-white/80 text-center">
                {formatXpNumber(xpProgress.current)} / {formatXpNumber(xpProgress.nextLevel)} XP to {nextLevel.name}
              </p>
            ) : (
              <p className="text-sm text-white/80 text-center">Max level reached!</p>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. Streak Section ───────────────────────────────────────── */}
      <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-(--color-text) flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Shopping Streak
            </h3>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-5xl font-bold text-(--color-text) tabular-nums">
                {streak.current}
              </span>
              <span className="text-(--color-text-secondary) text-sm">weeks in a row</span>
            </div>

            <p className="text-xs text-(--color-text-muted) mt-1">
              Personal best: {streak.best} weeks
            </p>
          </div>

          <div className="text-4xl" role="img" aria-label="streak fire">
            🔥
          </div>
        </div>

        {/* 12-week calendar */}
        <div className="mt-5">
          <p className="text-xs text-(--color-text-muted) mb-2">Last 12 weeks</p>
          <div className="flex items-center gap-1.5">
            {streakHistory.map((ordered, i) => (
              <div
                key={i}
                className={cn(
                  'w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all',
                  ordered
                    ? 'bg-(--brand-primary) border-(--brand-primary) text-white'
                    : 'border-(--color-border) bg-transparent'
                )}
              >
                {ordered && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Badges Grid ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-(--color-text) flex items-center gap-2">
            <Trophy className="w-5 h-5 text-(--brand-amber)" />
            Achievements
          </h3>
          <span className="text-sm text-(--color-text-muted)">
            {unlockedCount}/{totalBadgeCount} unlocked
          </span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {BADGE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setBadgeFilter(cat.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                badgeFilter === cat.value
                  ? 'bg-(--brand-primary) text-white border-(--brand-primary)'
                  : 'border-(--color-border) text-(--color-text-secondary) hover:border-(--color-text-muted)'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {filteredBadges.map((badge) => (
            <LoyaltyBadge
              key={badge.id}
              badge={badge}
              unlocked={unlockedBadgeIds.has(badge.id)}
              progress={badgeProgressMap[badge.id]}
            />
          ))}
        </div>
      </section>

      {/* ─── 4. Active Challenges ────────────────────────────────────── */}
      <section>
        <h3 className="text-lg font-semibold text-(--color-text) flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-(--color-success)" />
          This Week&apos;s Challenges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map(({ challenge, progress, completed }) => {
            const progressPercent = Math.min(
              Math.round((progress / challenge.target) * 100),
              100
            )
            const typeStyle = CHALLENGE_TYPE_STYLES[challenge.type] ?? CHALLENGE_TYPE_STYLES.weekly

            return (
              <div
                key={challenge.id}
                className={cn(
                  'relative rounded-xl border bg-(--color-surface) p-5 transition-all',
                  completed
                    ? 'border-(--color-success)/40'
                    : 'border-(--color-border)'
                )}
              >
                {/* Completed overlay */}
                {completed && (
                  <div className="absolute inset-0 rounded-xl bg-(--color-success)/5 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-(--color-success) flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-(--color-success)">Claimed!</span>
                    </div>
                  </div>
                )}

                {/* Type badge */}
                <span className={cn('inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold', typeStyle.className)}>
                  {typeStyle.label}
                </span>

                {/* Title */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xl">{challenge.icon}</span>
                  <h4 className="text-sm font-semibold text-(--color-text)">{challenge.title}</h4>
                </div>

                <p className="text-xs text-(--color-text-muted) mt-1">{challenge.description}</p>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-(--color-text-secondary)">{progress}/{challenge.target}</span>
                    <span className="text-(--color-text-muted)">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-(--color-border) overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        completed ? 'bg-(--color-success)' : 'bg-(--brand-primary)'
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-3 mt-3 text-[11px] font-medium text-(--color-text-muted)">
                  <span className="flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-(--brand-primary)" />
                    +{challenge.xpReward} XP
                  </span>
                  <span className="flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3 text-(--brand-amber)" />
                    +{challenge.pointsReward} pts
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── 5. Charity Round-Up ─────────────────────────────────────── */}
      <section className="rounded-2xl bg-(--brand-dark) text-white p-6 lg:p-8">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          Round Up for Charity
        </h3>
        <p className="text-sm text-white/70 mt-1 max-w-xl">
          Round up every order to the nearest &pound;1 and donate the difference to a charity of your choice.
        </p>

        {/* Toggle */}
        <div className="flex items-center gap-4 mt-5">
          <button
            type="button"
            role="switch"
            aria-checked={store.roundUpEnabled}
            onClick={() => store.toggleRoundUp()}
            className={cn(
              'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              store.roundUpEnabled ? 'bg-(--color-success)' : 'bg-white/20'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-6 w-6 rounded-full bg-(--color-surface) shadow-sm transition-transform',
                store.roundUpEnabled ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
          <span className="text-sm font-medium">
            {store.roundUpEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Charity cards */}
        {store.roundUpEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {availableCharities.map((charity) => {
              const isSelected = store.selectedCharity === charity.id
              return (
                <button
                  key={charity.id}
                  type="button"
                  onClick={() => store.setCharity(charity.id)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-rose-400 bg-white/10'
                      : 'border-white/10 hover:border-white/25'
                  )}
                >
                  <span className="text-2xl shrink-0">{charity.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{charity.name}</p>
                    <p className="text-xs text-white/60 mt-0.5">{charity.description}</p>
                  </div>
                  {isSelected && (
                    <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-rose-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Total donated */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-xs text-white/50 uppercase tracking-wider">Total donated to date</p>
          <p className="font-mono text-2xl font-bold mt-1">
            &pound;{(store.charityTotal / 100).toFixed(2)}
          </p>
          {store.charityTotal > 0 && (
            <p className="text-xs text-white/60 mt-1">
              Your donations have provided{' '}
              {Math.floor(store.charityTotal / 250)}{' '}
              meals to families in need
            </p>
          )}
        </div>
      </section>

      {/* ─── 6. Recent XP History ────────────────────────────────────── */}
      <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-(--color-text) flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-(--color-text-muted)" />
          Recent XP
        </h3>

        <ul className="space-y-3">
          {xpHistory.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-(--brand-primary) shrink-0" />
                <span className="text-sm text-(--color-text-secondary) truncate">
                  {entry.reason}
                </span>
              </div>
              <span className="text-sm font-semibold text-(--brand-primary) whitespace-nowrap">
                +{entry.xp} XP
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
