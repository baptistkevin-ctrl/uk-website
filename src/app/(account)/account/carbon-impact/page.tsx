'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Leaf, TrendingDown, TrendingUp, TreePine, Award, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CarbonRatingBadge, type CarbonRating } from '@/components/carbon/CarbonRatingBadge'

const UK_AVERAGE_MONTHLY_KG = 83

function getRatingForKg(kg: number): CarbonRating {
  if (kg < 1) return 'A'
  if (kg < 3) return 'B'
  if (kg < 6) return 'C'
  if (kg < 15) return 'D'
  return 'E'
}

const ratingBarColors: Record<CarbonRating, string> = {
  A: 'bg-(--color-success)',
  B: 'bg-green-400',
  C: 'bg-amber-400',
  D: 'bg-(--brand-amber)',
  E: 'bg-(--color-error)',
}

const DEFAULT_TIPS = [
  {
    title: 'Switch from beef to chicken',
    description:
      'Beef produces ~27kg CO\u2082/kg vs chicken at ~6.9kg. Swapping once a week could save ~5kg CO\u2082/month.',
  },
  {
    title: 'Choose seasonal UK produce',
    description:
      'Imported out-of-season fruit can have 10x the carbon footprint. Check for the UK flag on labels.',
  },
  {
    title: 'Opt for plant-based milk',
    description:
      'Oat milk produces ~0.9kg CO\u2082/litre vs dairy at ~3.2kg. An easy swap with big impact.',
  },
]

export default function CarbonImpactPage() {
  const [apiData, setApiData] = useState<{
    monthlyTotals: { month: string; co2Kg: number }[]
    totalCo2Kg: number
    monthlyAverage: number
    yearlyEstimate: number
    percentVsAverage: number
    rating: CarbonRating
    suggestions: { tip: string; potentialSavingKg: number }[]
    orderCount: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/carbon/impact')
        if (res.ok) {
          setApiData(await res.json())
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const MONTH_LABELS_MAP: Record<string, string> = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
  }

  const MONTHLY_DATA = useMemo(() => {
    if (!apiData?.monthlyTotals?.length) return []
    return apiData.monthlyTotals.map(m => Math.round(m.co2Kg))
  }, [apiData])

  const MONTH_LABELS = useMemo(() => {
    if (!apiData?.monthlyTotals?.length) return []
    return apiData.monthlyTotals.map(m => MONTH_LABELS_MAP[m.month.slice(5, 7)] || m.month.slice(5, 7))
  }, [apiData])

  const currentMonth = MONTHLY_DATA.length > 0 ? MONTHLY_DATA[MONTHLY_DATA.length - 1] : 0
  const previousMonth = MONTHLY_DATA.length > 1 ? MONTHLY_DATA[MONTHLY_DATA.length - 2] : 0
  const yearTotal = MONTHLY_DATA.reduce((sum, v) => sum + v, 0)
  const monthTrend = currentMonth - previousMonth
  const treesNeeded = +(yearTotal / 21).toFixed(1)
  const maxBar = Math.max(...MONTHLY_DATA, UK_AVERAGE_MONTHLY_KG, 1)
  const belowAverageMonths = MONTHLY_DATA.filter(v => v < UK_AVERAGE_MONTHLY_KG).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Carbon Impact' },
        ]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-(--color-text) sm:text-3xl">
          Your Carbon Impact
        </h1>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Track the environmental impact of your grocery shopping
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Leaf size={18} className="text-(--brand-primary)" />}
          label="This Month"
          value={`${currentMonth} kg`}
          sub={
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                monthTrend <= 0
                  ? 'text-(--color-success)'
                  : 'text-(--color-error)'
              )}
            >
              {monthTrend <= 0 ? (
                <TrendingDown size={12} />
              ) : (
                <TrendingUp size={12} />
              )}
              {Math.abs(monthTrend)} kg vs last month
            </span>
          }
        />
        <StatCard
          icon={<Leaf size={18} className="text-(--brand-primary)" />}
          label="This Year"
          value={`${yearTotal} kg`}
        />
        <StatCard
          icon={<Leaf size={18} className="text-(--color-text-muted)" />}
          label="UK Average"
          value={`${UK_AVERAGE_MONTHLY_KG} kg/mo`}
          sub={
            currentMonth < UK_AVERAGE_MONTHLY_KG ? (
              <span className="text-xs font-medium text-(--color-success)">
                You&apos;re below average!
              </span>
            ) : (
              <span className="text-xs font-medium text-(--color-warning)">
                Above UK average
              </span>
            )
          }
        />
        <StatCard
          icon={<TreePine size={18} className="text-(--brand-primary)" />}
          label="Trees Needed"
          value={`${treesNeeded}`}
          sub={
            <span className="text-xs text-(--color-text-muted)">
              to offset this year
            </span>
          }
        />
      </div>

      {/* Monthly chart */}
      <div className="mt-8 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-(--color-text)">
          Monthly Carbon Footprint
        </h2>
        <p className="mt-0.5 text-xs text-(--color-text-muted)">
          Last 12 months (kg CO&#8322;)
        </p>

        <div className="mt-4 flex items-end gap-1.5 sm:gap-2" style={{ height: 160 }}>
          {MONTHLY_DATA.map((kg, i) => {
            const rating = getRatingForKg(kg)
            const heightPercent = (kg / maxBar) * 100

            return (
              <div
                key={i}
                className="group relative flex flex-1 flex-col items-center"
                style={{ height: '100%' }}
              >
                <div className="flex flex-1 w-full items-end">
                  <div
                    className={cn(
                      'w-full rounded-t transition-all',
                      ratingBarColors[rating],
                      'group-hover:opacity-80'
                    )}
                    style={{ height: `${heightPercent}%`, minHeight: 4 }}
                    title={`${MONTH_LABELS[i]}: ${kg} kg CO\u2082`}
                  />
                </div>
                <span className="mt-1 text-[11px] text-(--color-text-muted)">
                  {MONTH_LABELS[i]}
                </span>
              </div>
            )
          })}
        </div>

        {/* UK average line indicator */}
        <div className="mt-2 flex items-center gap-2 text-xs text-(--color-text-muted)">
          <span className="h-0.5 w-4 bg-(--color-text-muted)" />
          <span>UK avg: {UK_AVERAGE_MONTHLY_KG} kg/mo</span>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-(--color-text)">
          How to Reduce Your Footprint
        </h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(apiData?.suggestions?.length
            ? apiData.suggestions.map(s => ({ title: s.tip.split('.')[0], description: s.tip }))
            : DEFAULT_TIPS
          ).map((tip, i) => (
            <div
              key={i}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-sm font-semibold text-(--color-text)">
                {tip.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-(--color-text-secondary)">
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Eco badges */}
      <div className="mt-8 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-(--color-text)">
          Your Eco Badges
        </h2>

        <div className="mt-3 flex flex-wrap gap-3">
          {currentMonth < UK_AVERAGE_MONTHLY_KG && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-(--color-success)/10 px-3 py-2">
              <Award size={18} className="text-(--color-success)" />
              <div>
                <span className="block text-sm font-semibold text-(--color-success)">
                  Eco Champion
                </span>
                <span className="text-xs text-(--color-text-secondary)">
                  Below UK average this month
                </span>
              </div>
            </div>
          )}

          {belowAverageMonths >= 3 && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-(--brand-primary)/10 px-3 py-2">
              <TreePine size={18} className="text-(--brand-primary)" />
              <div>
                <span className="block text-sm font-semibold text-(--brand-primary)">
                  {belowAverageMonths} Month Streak
                </span>
                <span className="text-xs text-(--color-text-secondary)">
                  {belowAverageMonths} months below UK average
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3 sm:p-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-(--color-text-muted)">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-(--color-text) sm:text-xl">
        {value}
      </p>
      {sub && <div className="mt-0.5">{sub}</div>}
    </div>
  )
}
