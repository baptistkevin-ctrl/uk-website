'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  PoundSterling,
  ShoppingCart,
  PiggyBank,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Star,
  Award,
  Zap,
  Target,
  Share2,
  Pencil,
  Loader2,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthlySpend {
  month: string
  label: string
  amount: number
}

interface CategoryBreakdown {
  name: string
  amount: number
  percentage: number
  color: string
  topProduct: string
}

interface TopProduct {
  id: string
  name: string
  image: string
  purchaseCount: number
  totalSpent: number
}

interface Insight {
  icon: React.ReactNode
  title: string
  description: string
}

interface YearReview {
  year: number
  totalSpent: number
  totalOrders: number
  totalItems: number
  totalSaved: number
  favouriteCategory: string
  mostBoughtProduct: string
}

interface SpendingData {
  totalSpent: number
  averageOrder: number
  totalSaved: number
  totalOrders: number
  monthlySpending: MonthlySpend[]
  categories: CategoryBreakdown[]
  topProducts: TopProduct[]
  budget: number | null
  currentMonthSpend: number
  busiestDay: string
  avgItemsPerOrder: number
  mostExpensiveOrder: number
  yearReview: YearReview | null
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = [
  '#1B6B3A', '#E8861A', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F59E0B', '#6366F1',
]

const MOCK_DATA: SpendingData = {
  totalSpent: 487692,
  averageOrder: 5840,
  totalSaved: 14230,
  totalOrders: 84,
  monthlySpending: [
    { month: '2025-05', label: 'May', amount: 32400 },
    { month: '2025-06', label: 'Jun', amount: 41200 },
    { month: '2025-07', label: 'Jul', amount: 38700 },
    { month: '2025-08', label: 'Aug', amount: 45100 },
    { month: '2025-09', label: 'Sep', amount: 36800 },
    { month: '2025-10', label: 'Oct', amount: 42300 },
    { month: '2025-11', label: 'Nov', amount: 51200 },
    { month: '2025-12', label: 'Dec', amount: 62400 },
    { month: '2026-01', label: 'Jan', amount: 39600 },
    { month: '2026-02', label: 'Feb', amount: 35800 },
    { month: '2026-03', label: 'Mar', amount: 41500 },
    { month: '2026-04', label: 'Apr', amount: 20692 },
  ],
  categories: [
    { name: 'Fresh Produce', amount: 121900, percentage: 25, color: CATEGORY_COLORS[0], topProduct: 'Organic Bananas' },
    { name: 'Dairy & Eggs', amount: 87800, percentage: 18, color: CATEGORY_COLORS[1], topProduct: 'Free Range Eggs 12pk' },
    { name: 'Meat & Fish', amount: 78000, percentage: 16, color: CATEGORY_COLORS[2], topProduct: 'British Chicken Breast 500g' },
    { name: 'Bakery', amount: 53500, percentage: 11, color: CATEGORY_COLORS[3], topProduct: 'Sourdough Loaf' },
    { name: 'Drinks', amount: 48800, percentage: 10, color: CATEGORY_COLORS[4], topProduct: 'Oat Milk 1L' },
    { name: 'Frozen', amount: 39000, percentage: 8, color: CATEGORY_COLORS[5], topProduct: 'Garden Peas 1kg' },
    { name: 'Snacks', amount: 34200, percentage: 7, color: CATEGORY_COLORS[6], topProduct: 'Kettle Chips Sea Salt' },
    { name: 'Household', amount: 24492, percentage: 5, color: CATEGORY_COLORS[7], topProduct: 'Fairy Washing Up Liquid' },
  ],
  topProducts: [
    { id: '1', name: 'Organic Bananas', image: '/images/products/bananas.jpg', purchaseCount: 42, totalSpent: 5460 },
    { id: '2', name: 'Semi-Skimmed Milk 2L', image: '/images/products/milk.jpg', purchaseCount: 38, totalSpent: 6080 },
    { id: '3', name: 'Free Range Eggs 12pk', image: '/images/products/eggs.jpg', purchaseCount: 35, totalSpent: 10500 },
    { id: '4', name: 'Sourdough Loaf', image: '/images/products/bread.jpg', purchaseCount: 31, totalSpent: 8060 },
    { id: '5', name: 'British Chicken Breast 500g', image: '/images/products/chicken.jpg', purchaseCount: 28, totalSpent: 14000 },
    { id: '6', name: 'Oat Milk 1L', image: '/images/products/oatmilk.jpg', purchaseCount: 26, totalSpent: 4420 },
    { id: '7', name: 'Avocados Pack of 2', image: '/images/products/avocado.jpg', purchaseCount: 24, totalSpent: 3600 },
    { id: '8', name: 'Cherry Tomatoes 300g', image: '/images/products/tomatoes.jpg', purchaseCount: 22, totalSpent: 3080 },
    { id: '9', name: 'Greek Yoghurt 500g', image: '/images/products/yoghurt.jpg', purchaseCount: 20, totalSpent: 3400 },
    { id: '10', name: 'Kettle Chips Sea Salt 150g', image: '/images/products/crisps.jpg', purchaseCount: 18, totalSpent: 3240 },
  ],
  budget: 45000,
  currentMonthSpend: 20692,
  busiestDay: 'Saturday',
  avgItemsPerOrder: 14,
  mostExpensiveOrder: 12460,
  yearReview: {
    year: 2026,
    totalSpent: 487692,
    totalOrders: 84,
    totalItems: 1176,
    totalSaved: 14230,
    favouriteCategory: 'Fresh Produce',
    mostBoughtProduct: 'Organic Bananas',
  },
}

type Period = '3M' | '6M' | '12M' | 'All'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SpendingPage() {
  const [data, setData] = useState<SpendingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('12M')
  const [budgetInput, setBudgetInput] = useState('')
  const [editingBudget, setEditingBudget] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/spending', {
          signal: controller.signal,
        })
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setData(MOCK_DATA)
        }
      } catch {
        setData(MOCK_DATA)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [])

  if (loading) return <SpendingSkeleton />
  if (!data) return <EmptyState />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Spending Insights' },
        ]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-(--color-text)">
          Spending Insights
        </h1>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Understand your grocery spending habits
        </p>
      </div>

      {/* 1 — Summary Stats */}
      <SummaryStats data={data} />

      {/* 2 — Monthly Spending Chart */}
      <MonthlyChart
        months={data.monthlySpending}
        period={period}
        onPeriodChange={setPeriod}
        hoveredBar={hoveredBar}
        onBarHover={setHoveredBar}
      />

      {/* 3 — Category Breakdown */}
      <CategoryBreakdownSection categories={data.categories} totalSpent={data.totalSpent} />

      {/* 4 — Top Products */}
      <TopProductsSection products={data.topProducts} />

      {/* 5 — Budget Tracker */}
      <BudgetTracker
        budget={data.budget}
        currentSpend={data.currentMonthSpend}
        editing={editingBudget}
        budgetInput={budgetInput}
        onBudgetInputChange={setBudgetInput}
        onToggleEdit={() => setEditingBudget((prev) => !prev)}
        onSave={() => setEditingBudget(false)}
      />

      {/* 6 — Trends & Insights */}
      <InsightsSection data={data} />

      {/* 7 — Year in Review */}
      {data.yearReview && <YearInReview review={data.yearReview} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1. Summary Stats
// ---------------------------------------------------------------------------

function SummaryStats({ data }: { data: SpendingData }) {
  const stats = [
    {
      icon: <PoundSterling size={20} />,
      bgClass: 'bg-(--brand-primary)/15 text-(--brand-primary)',
      value: formatPrice(data.totalSpent),
      label: 'Total Spent',
    },
    {
      icon: <ShoppingCart size={20} />,
      bgClass: 'bg-(--color-info)/15 text-(--color-info)',
      value: formatPrice(data.averageOrder),
      label: 'Average Order',
    },
    {
      icon: <PiggyBank size={20} />,
      bgClass: 'bg-(--color-success)/15 text-(--color-success)',
      value: formatPrice(data.totalSaved),
      label: 'Total Saved',
    },
    {
      icon: <Package size={20} />,
      bgClass: 'bg-(--brand-amber)/15 text-(--brand-amber)',
      value: data.totalOrders.toString(),
      label: 'Total Orders',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              s.bgClass
            )}
          >
            {s.icon}
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-(--color-text)">
            {s.value}
          </p>
          <p className="mt-0.5 text-xs text-(--color-text-muted)">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. Monthly Chart
// ---------------------------------------------------------------------------

function MonthlyChart({
  months,
  period,
  onPeriodChange,
  hoveredBar,
  onBarHover,
}: {
  months: MonthlySpend[]
  period: Period
  onPeriodChange: (p: Period) => void
  hoveredBar: number | null
  onBarHover: (i: number | null) => void
}) {
  const periodSlice: Record<Period, number> = {
    '3M': 3,
    '6M': 6,
    '12M': 12,
    All: months.length,
  }

  const visible = months.slice(-periodSlice[period])
  const maxAmount = Math.max(...visible.map((m) => m.amount))
  const avg = visible.reduce((s, m) => s + m.amount, 0) / visible.length
  const avgPercent = (avg / maxAmount) * 100

  const lastMonth = visible[visible.length - 1]?.amount ?? 0
  const prevMonth = visible[visible.length - 2]?.amount ?? lastMonth
  const trendPercent =
    prevMonth > 0 ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100) : 0
  const trendUp = trendPercent >= 0

  // Grid lines at £100 intervals
  const gridMax = Math.ceil(maxAmount / 10000) * 10000
  const gridLines: number[] = []
  for (let v = 10000; v <= gridMax; v += 10000) {
    gridLines.push(v)
  }

  const periods: Period[] = ['3M', '6M', '12M', 'All']

  return (
    <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-(--color-text)">
          Monthly Spending
        </h3>
        <div className="flex gap-1 rounded-lg bg-(--color-bg) p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                period === p
                  ? 'bg-(--brand-primary) text-white'
                  : 'text-(--color-text-muted) hover:text-(--color-text)'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="relative mt-6" style={{ height: 220 }}>
        {/* Horizontal grid lines */}
        {gridLines.map((v) => {
          const bottom = (v / maxAmount) * 100
          return (
            <div
              key={v}
              className="absolute left-0 right-0 border-t border-(--color-border)/50"
              style={{ bottom: `${bottom}%` }}
            >
              <span className="absolute -top-3 left-0 text-[11px] text-(--color-text-muted)">
                {formatPrice(v)}
              </span>
            </div>
          )
        })}

        {/* Average dashed line */}
        <div
          className="absolute left-8 right-0 border-t-2 border-dashed border-(--brand-amber)/60"
          style={{ bottom: `${avgPercent}%` }}
        >
          <span className="absolute -top-3 right-0 rounded bg-(--brand-amber)/10 px-1.5 text-[11px] font-medium text-(--brand-amber)">
            Avg {formatPrice(Math.round(avg))}
          </span>
        </div>

        {/* Bars */}
        <div className="flex h-full items-end gap-1.5 pl-8 sm:gap-2">
          {visible.map((m, i) => {
            const heightPercent = (m.amount / maxAmount) * 100
            const isHovered = hoveredBar === i
            return (
              <div
                key={m.month}
                className="group relative flex flex-1 flex-col items-center"
                style={{ height: '100%' }}
                onMouseEnter={() => onBarHover(i)}
                onMouseLeave={() => onBarHover(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-8 z-10 whitespace-nowrap rounded-lg bg-(--color-elevated) px-2.5 py-1 text-xs font-semibold text-(--color-text) shadow-(--shadow-md)">
                    {formatPrice(m.amount)}
                  </div>
                )}
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      'w-full rounded-t transition-all duration-200',
                      isHovered
                        ? 'bg-(--brand-primary) opacity-90'
                        : 'bg-(--brand-primary)/80'
                    )}
                    style={{ height: `${heightPercent}%`, minHeight: 4 }}
                  />
                </div>
                <span className="mt-1.5 text-[11px] text-(--color-text-muted)">
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trend indicator */}
      <div className="mt-4 flex items-center gap-1.5">
        {trendUp ? (
          <TrendingUp size={14} className="text-(--color-error)" />
        ) : (
          <TrendingDown size={14} className="text-(--color-success)" />
        )}
        <span
          className={cn(
            'text-sm font-medium',
            trendUp ? 'text-(--color-error)' : 'text-(--color-success)'
          )}
        >
          {trendUp ? '↑' : '↓'} {Math.abs(trendPercent)}% vs last month
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. Category Breakdown
// ---------------------------------------------------------------------------

function CategoryBreakdownSection({
  categories,
  totalSpent,
}: {
  categories: CategoryBreakdown[]
  totalSpent: number
}) {
  const conicSegments = useMemo(() => {
    let cumulative = 0
    return categories.map((c) => {
      const start = cumulative
      cumulative += c.percentage
      return `${c.color} ${start}% ${cumulative}%`
    })
  }, [categories])

  const conicGradient = `conic-gradient(${conicSegments.join(', ')})`

  return (
    <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
      <h3 className="text-lg font-semibold text-(--color-text)">
        Spending by Category
      </h3>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Donut chart */}
        <div className="flex items-center justify-center">
          <div className="relative h-52 w-52">
            <div
              className="h-full w-full rounded-full"
              style={{ background: conicGradient }}
            />
            <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-(--color-surface)">
              <span className="text-xs text-(--color-text-muted)">Total</span>
              <span className="font-mono text-xl font-bold text-(--color-text)">
                {formatPrice(totalSpent)}
              </span>
            </div>
          </div>
        </div>

        {/* Category list */}
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-(--color-text)">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-(--color-text-muted)">
                    {cat.percentage}%
                  </span>
                  <span className="text-sm font-semibold text-(--color-text)">
                    {formatPrice(cat.amount)}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-(--color-bg)">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-(--color-text-muted)">
                Top: {cat.topProduct}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. Top Products
// ---------------------------------------------------------------------------

function TopProductsSection({ products }: { products: TopProduct[] }) {
  return (
    <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
      <h3 className="text-lg font-semibold text-(--color-text)">
        Your Most Purchased
      </h3>

      <div className="mt-4 divide-y divide-(--color-border)">
        {products.map((product, i) => (
          <div
            key={product.id}
            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-bg) text-xs font-bold text-(--color-text-muted)">
              {i + 1}
            </span>
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-(--color-bg)">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-(--color-text)">
                {product.name}
              </p>
              <p className="text-xs text-(--color-text-muted)">
                Purchased {product.purchaseCount} times
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold text-(--color-text)">
              {formatPrice(product.totalSpent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. Budget Tracker
// ---------------------------------------------------------------------------

function BudgetTracker({
  budget,
  currentSpend,
  editing,
  budgetInput,
  onBudgetInputChange,
  onToggleEdit,
  onSave,
}: {
  budget: number | null
  currentSpend: number
  editing: boolean
  budgetInput: string
  onBudgetInputChange: (v: string) => void
  onToggleEdit: () => void
  onSave: () => void
}) {
  const hasBudget = budget !== null && budget > 0

  const percentage = hasBudget ? Math.min((currentSpend / budget) * 100, 100) : 0
  const overBudget = hasBudget && currentSpend > budget
  const nearBudget = hasBudget && percentage >= 80 && !overBudget

  const ringColor = overBudget
    ? 'var(--color-error)'
    : nearBudget
      ? 'var(--color-warning)'
      : 'var(--color-success)'

  // Days remaining in month
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - now.getDate()
  const daysPassed = now.getDate()

  // Projected spend
  const dailyRate = daysPassed > 0 ? currentSpend / daysPassed : 0
  const projectedTotal = Math.round(dailyRate * daysInMonth)

  // SVG ring
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
      <h3 className="text-lg font-semibold text-(--color-text)">
        Monthly Budget
      </h3>

      {!hasBudget || editing ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p className="text-sm text-(--color-text-secondary)">
            Set a monthly grocery budget to track your spending
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-(--color-text)">£</span>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => onBudgetInputChange(e.target.value)}
              placeholder="450"
              className="w-32 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:outline-none focus:ring-1 focus:ring-(--brand-primary)"
            />
            <button
              onClick={onSave}
              className="rounded-lg bg-(--brand-primary) px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--brand-primary)/90"
            >
              Save
            </button>
            {editing && (
              <button
                onClick={onToggleEdit}
                className="rounded-lg px-3 py-2 text-sm text-(--color-text-muted) hover:text-(--color-text)"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* SVG Ring */}
          <div className="relative flex shrink-0 items-center justify-center">
            <svg width="164" height="164" viewBox="0 0 164 164">
              <circle
                cx="82"
                cy="82"
                r={radius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="10"
              />
              <circle
                cx="82"
                cy="82"
                r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 82 82)"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-lg font-bold text-(--color-text)">
                {Math.round(percentage)}%
              </span>
              <span className="text-[11px] text-(--color-text-muted)">used</span>
            </div>
          </div>

          {/* Budget details */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <p className="text-sm text-(--color-text)">
              <span className="font-mono font-bold">{formatPrice(currentSpend)}</span>{' '}
              of{' '}
              <span className="font-mono font-semibold">{formatPrice(budget)}</span>{' '}
              spent
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-(--color-text-secondary)">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {daysRemaining} days remaining
              </span>
              <span className="inline-flex items-center gap-1">
                <Target size={12} />
                Projected: {formatPrice(projectedTotal)}
              </span>
            </div>

            <p
              className={cn(
                'text-sm font-medium',
                overBudget
                  ? 'text-(--color-error)'
                  : nearBudget
                    ? 'text-(--color-warning)'
                    : 'text-(--color-success)'
              )}
            >
              {overBudget
                ? `Over budget by ${formatPrice(currentSpend - budget)}`
                : nearBudget
                  ? 'Approaching your budget limit'
                  : 'On track — looking good!'}
            </p>

            <button
              onClick={onToggleEdit}
              className="inline-flex items-center gap-1 text-xs font-medium text-(--brand-primary) hover:underline"
            >
              <Pencil size={12} />
              Edit budget
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 6. Insights
// ---------------------------------------------------------------------------

function InsightsSection({ data }: { data: SpendingData }) {
  const insights: Insight[] = [
    {
      icon: <Calendar size={18} className="text-(--color-info)" />,
      title: `Your busiest shopping day is ${data.busiestDay}`,
      description: 'Most of your orders are placed on this day of the week.',
    },
    {
      icon: <ShoppingCart size={18} className="text-(--brand-primary)" />,
      title: `Average ${data.avgItemsPerOrder} items per order`,
      description: 'This is how many items you typically add to your basket.',
    },
    {
      icon: <PiggyBank size={18} className="text-(--color-success)" />,
      title: `You saved ${formatPrice(data.totalSaved)} this year through deals`,
      description: 'Keep using offers and loyalty rewards to save more.',
    },
    {
      icon: <Zap size={18} className="text-(--brand-amber)" />,
      title: `Your most expensive order was ${formatPrice(data.mostExpensiveOrder)}`,
      description: 'That was a big shop! Perfect for stocking up.',
    },
  ]

  return (
    <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
      <h3 className="text-lg font-semibold text-(--color-text)">Insights</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.title}
            className="flex gap-3 rounded-xl border border-(--color-border) bg-(--color-bg) p-4"
          >
            <div className="mt-0.5 shrink-0">{insight.icon}</div>
            <div>
              <p className="text-sm font-semibold text-(--color-text)">
                {insight.title}
              </p>
              <p className="mt-0.5 text-xs text-(--color-text-muted)">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 7. Year in Review
// ---------------------------------------------------------------------------

function YearInReview({ review }: { review: YearReview }) {
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `My ${review.year} Grocery Year in Review: ${formatPrice(review.totalSpent)} spent across ${review.totalOrders} orders. My favourite category was ${review.favouriteCategory}!`
      )
    } catch {
      // Clipboard API not available
    }
  }, [review])

  const stats = [
    { label: 'Total Spent', value: formatPrice(review.totalSpent) },
    { label: 'Orders', value: review.totalOrders.toString() },
    { label: 'Items Bought', value: review.totalItems.toLocaleString() },
    { label: 'Saved', value: formatPrice(review.totalSaved) },
    { label: 'Top Category', value: review.favouriteCategory },
    { label: 'Most Bought', value: review.mostBoughtProduct },
  ]

  return (
    <div className="mt-8 overflow-hidden rounded-2xl bg-(--brand-dark) p-8 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/60">
            Year in Review
          </p>
          <h3 className="mt-1 font-display text-2xl font-bold">{review.year}</h3>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
        >
          <Share2 size={14} />
          Share
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-xs text-white/60">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-white/40">
        <Award size={14} />
        <span>Your personalised grocery spending summary</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SpendingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-(--color-border)" />

      {/* Title skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-(--color-border)" />
        <div className="h-4 w-72 animate-pulse rounded bg-(--color-border)" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-10 w-10 animate-pulse rounded-lg bg-(--color-border)" />
            <div className="mt-3 h-7 w-24 animate-pulse rounded bg-(--color-border)" />
            <div className="mt-1.5 h-3 w-16 animate-pulse rounded bg-(--color-border)" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 animate-pulse rounded bg-(--color-border)" />
          <div className="h-7 w-40 animate-pulse rounded-lg bg-(--color-border)" />
        </div>
        <div className="mt-6 flex items-end gap-2" style={{ height: 220 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-(--color-border)"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>

      {/* Category skeleton */}
      <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-(--color-border)" />
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="flex items-center justify-center">
            <div className="h-52 w-52 animate-pulse rounded-full bg-(--color-border)" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 w-full animate-pulse rounded bg-(--color-border)" />
                <div className="mt-1.5 h-1.5 w-full animate-pulse rounded-full bg-(--color-border)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products skeleton */}
      <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-(--color-border)" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-6 w-6 animate-pulse rounded-full bg-(--color-border)" />
              <div className="h-10 w-10 animate-pulse rounded-lg bg-(--color-border)" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 animate-pulse rounded bg-(--color-border)" />
                <div className="h-3 w-20 animate-pulse rounded bg-(--color-border)" />
              </div>
              <div className="h-4 w-14 animate-pulse rounded bg-(--color-border)" />
            </div>
          ))}
        </div>
      </div>

      {/* Budget skeleton */}
      <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
        <div className="h-5 w-32 animate-pulse rounded bg-(--color-border)" />
        <div className="mt-4 flex items-center gap-6">
          <div className="h-40 w-40 animate-pulse rounded-full bg-(--color-border)" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-48 animate-pulse rounded bg-(--color-border)" />
            <div className="h-3 w-36 animate-pulse rounded bg-(--color-border)" />
            <div className="h-3 w-32 animate-pulse rounded bg-(--color-border)" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Spending Insights' },
        ]}
        className="mb-6"
      />

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--brand-primary)/10">
          <ShoppingBag size={28} className="text-(--brand-primary)" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-(--color-text)">
          No spending data yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-(--color-text-muted)">
          Start shopping to see your insights. We will track your spending,
          savings, and favourite products automatically.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-(--brand-primary) px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--brand-primary)/90"
        >
          Start Shopping
        </Link>
      </div>
    </div>
  )
}
