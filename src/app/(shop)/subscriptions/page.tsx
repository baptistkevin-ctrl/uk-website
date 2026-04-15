'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  CalendarDays,
  PiggyBank,
  Package,
  ShoppingBag,
  Truck,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { formatUKDate } from '@/lib/locale'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard'
import {
  useSubscriptionStore,
  SUBSCRIPTION_DISCOUNT,
} from '@/stores/subscription-store'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BREADCRUMB_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Subscribe & Save' },
]

const BENEFITS = [
  {
    icon: RefreshCw,
    title: 'Never run out',
    description: 'Automatic deliveries on your schedule',
  },
  {
    icon: PiggyBank,
    title: 'Save money',
    description: `${SUBSCRIPTION_DISCOUNT}% off every subscription delivery`,
  },
  {
    icon: PauseCircle,
    title: 'Flexible',
    description: 'Pause, skip, or cancel anytime — no commitment',
  },
  {
    icon: Truck,
    title: 'Free delivery',
    description: 'Free delivery on all subscription orders',
  },
]

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    icon: ShoppingBag,
    title: 'Choose products',
    description: 'Add your regular essentials and set a delivery frequency.',
  },
  {
    step: 2,
    icon: CalendarDays,
    title: 'Set frequency',
    description: 'Weekly, fortnightly, monthly — whatever suits your household.',
  },
  {
    step: 3,
    icon: Sparkles,
    title: 'Save automatically',
    description: `Get ${SUBSCRIPTION_DISCOUNT}% off every delivery with no effort.`,
  },
]

const FAQ_ITEMS = [
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, you can cancel any subscription at any time with no penalties or fees. You can also pause a subscription if you want to take a break and resume it later.',
  },
  {
    question: 'How does the discount work?',
    answer: `You automatically receive ${SUBSCRIPTION_DISCOUNT}% off the regular price on every subscription delivery. The discount is applied at checkout and you can see your savings on each item.`,
  },
  {
    question: 'When will I be charged?',
    answer:
      'You are charged the day before each scheduled delivery. You will receive an email reminder 48 hours before each delivery so you have time to make changes, skip, or cancel.',
  },
  {
    question: 'Can I change my delivery frequency?',
    answer:
      'Absolutely. You can change the frequency of any subscription at any time from your dashboard. The change takes effect from your next scheduled delivery.',
  },
]

// ---------------------------------------------------------------------------
// Stats Row
// ---------------------------------------------------------------------------

function StatsRow() {
  const { getActiveSubscriptions, getNextDeliveryDate, getMonthlyEstimate, getTotalSavings } =
    useSubscriptionStore()

  const active = getActiveSubscriptions()
  const nextDate = getNextDeliveryDate()
  const monthlyEstimate = getMonthlyEstimate()
  const totalSavings = getTotalSavings()

  if (active.length === 0) return null

  const stats = [
    {
      label: 'Active subscriptions',
      value: active.length.toString(),
      icon: Package,
    },
    {
      label: 'Next delivery',
      value: nextDate ? formatUKDate(new Date(nextDate)) : '—',
      icon: CalendarDays,
    },
    {
      label: 'Monthly estimate',
      value: formatPrice(Math.round(monthlyEstimate)),
      icon: RefreshCw,
    },
    {
      label: 'Total saved',
      value: formatPrice(totalSavings),
      icon: PiggyBank,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'rounded-xl border border-(--color-border) bg-(--color-surface) p-4',
            'flex flex-col gap-2'
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--brand-primary)/10 text-(--brand-primary)">
              <stat.icon size={16} />
            </div>
          </div>
          <p className="text-lg font-bold text-(--color-text)">{stat.value}</p>
          <p className="text-xs text-(--color-text-muted)">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-(--brand-amber)/10">
        <RefreshCw size={32} className="text-(--brand-amber)" />
      </div>

      <h2 className="mb-2 font-display text-xl font-bold text-(--color-text)">
        No subscriptions yet
      </h2>
      <p className="mx-auto mb-8 max-w-md text-sm text-(--color-text-secondary)">
        Subscribe to your regular products and save {SUBSCRIPTION_DISCOUNT}% on every delivery.
        Pause, skip, or cancel anytime.
      </p>

      {/* Benefits grid */}
      <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className={cn(
              'flex items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4',
              'text-left'
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--brand-primary)/10 text-(--brand-primary)">
              <benefit.icon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-(--color-text)">{benefit.title}</h3>
              <p className="mt-0.5 text-xs text-(--color-text-muted)">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/products"
        className={cn(
          'inline-flex items-center gap-2 rounded-lg bg-(--brand-amber) px-6 py-3',
          'font-semibold text-white shadow-(--shadow-amber) transition-all',
          'hover:-translate-y-0.5 hover:bg-(--brand-amber-hover)',
          'active:translate-y-0'
        )}
      >
        Browse Products
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------

function HowItWorks() {
  return (
    <section className="mt-16">
      <h2 className="mb-6 text-center font-display text-lg font-bold text-(--color-text)">
        How it works
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {HOW_IT_WORKS_STEPS.map((item) => (
          <div key={item.step} className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-(--brand-amber)/10">
              <item.icon size={24} className="text-(--brand-amber)" />
            </div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-(--brand-amber)">
              Step {item.step}
            </div>
            <h3 className="mb-1 text-sm font-semibold text-(--color-text)">{item.title}</h3>
            <p className="text-xs text-(--color-text-muted)">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// FAQ Accordion
// ---------------------------------------------------------------------------

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-center font-display text-lg font-bold text-(--color-text)">
        Frequently asked questions
      </h2>
      <div className="mx-auto max-w-2xl divide-y divide-(--color-border) rounded-xl border border-(--color-border) bg-(--color-surface)">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-(--color-text)">
                  <HelpCircle size={16} className="shrink-0 text-(--color-text-muted)" />
                  {item.question}
                </span>
                {isOpen ? (
                  <ChevronUp size={16} className="shrink-0 text-(--color-text-muted)" />
                ) : (
                  <ChevronDown size={16} className="shrink-0 text-(--color-text-muted)" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pl-11">
                  <p className="text-sm leading-relaxed text-(--color-text-secondary)">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SubscriptionsPage() {
  const { subscriptions } = useSubscriptionStore()
  const [showPaused, setShowPaused] = useState(false)

  const activeSubscriptions = useMemo(
    () =>
      subscriptions
        .filter((s) => s.status === 'active')
        .sort(
          (a, b) =>
            new Date(a.nextDeliveryDate).getTime() -
            new Date(b.nextDeliveryDate).getTime()
        ),
    [subscriptions]
  )

  const pausedSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === 'paused'),
    [subscriptions]
  )

  const hasSubscriptions = activeSubscriptions.length > 0 || pausedSubscriptions.length > 0

  return (
    <Container className="py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={BREADCRUMB_ITEMS} className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-(--color-text) sm:text-3xl">
          Subscribe &amp; Save
        </h1>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Never run out of essentials. Save {SUBSCRIPTION_DISCOUNT}% on every delivery.
        </p>
      </div>

      {hasSubscriptions ? (
        <>
          {/* Stats */}
          <StatsRow />

          {/* Active Subscriptions */}
          {activeSubscriptions.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-(--color-text)">
                <Package size={18} className="text-(--brand-primary)" />
                Active subscriptions
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--brand-primary)/10 px-1.5 text-xs font-bold text-(--brand-primary)">
                  {activeSubscriptions.length}
                </span>
              </h2>
              <div className="space-y-3">
                {activeSubscriptions.map((sub) => (
                  <SubscriptionCard key={sub.id} subscription={sub} />
                ))}
              </div>
            </section>
          )}

          {/* Paused Subscriptions (collapsible) */}
          {pausedSubscriptions.length > 0 && (
            <section className="mt-8">
              <button
                type="button"
                onClick={() => setShowPaused((v) => !v)}
                className="mb-4 flex w-full items-center gap-2 text-left text-base font-semibold text-(--color-text)"
              >
                <PauseCircle size={18} className="text-(--color-warning)" />
                Paused subscriptions
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-warning)/10 px-1.5 text-xs font-bold text-(--color-warning)">
                  {pausedSubscriptions.length}
                </span>
                {showPaused ? (
                  <ChevronUp size={16} className="ml-auto text-(--color-text-muted)" />
                ) : (
                  <ChevronDown size={16} className="ml-auto text-(--color-text-muted)" />
                )}
              </button>
              {showPaused && (
                <div className="space-y-3">
                  {pausedSubscriptions.map((sub) => (
                    <SubscriptionCard key={sub.id} subscription={sub} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <EmptyState />
      )}

      {/* How it works */}
      <HowItWorks />

      {/* FAQ */}
      <FAQAccordion />
    </Container>
  )
}
