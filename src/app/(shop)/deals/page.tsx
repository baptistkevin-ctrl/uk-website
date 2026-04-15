import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Zap, Clock, Flame, Sparkles } from 'lucide-react'
import { DealCard, DealBanner } from '@/components/deals'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

// ISR: revalidate deals every 30 seconds (time-sensitive content)
export const revalidate = 30

export const metadata: Metadata = {
  title: 'Flash Deals | Fresh Groceries',
  description: 'Limited time offers and flash deals on fresh groceries. Save big on your favorite products!',
}

async function FeaturedDeal() {
  const supabase = await createClient()

  const { data: featuredDeal } = await supabase
    .from('flash_deals')
    .select(`
      *,
      product:products(
        id,
        name,
        slug,
        short_description,
        price_pence,
        compare_at_price_pence,
        image_url,
        is_organic,
        is_vegan
      )
    `)
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())
    .lte('starts_at', new Date().toISOString())
    .order('ends_at', { ascending: true })
    .limit(1)
    .single()

  if (!featuredDeal) return null

  return <DealBanner deal={featuredDeal} />
}

async function AllDeals() {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from('flash_deals')
    .select(`
      *,
      product:products(
        id,
        name,
        slug,
        short_description,
        price_pence,
        compare_at_price_pence,
        image_url,
        is_organic,
        is_vegan
      )
    `)
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())
    .lte('starts_at', new Date().toISOString())
    .order('ends_at', { ascending: true })

  if (!deals || deals.length === 0) {
    return (
      <div className="text-center py-16 bg-background rounded-2xl">
        <div className="w-20 h-20 bg-(--brand-amber-soft) rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="h-10 w-10 text-(--brand-amber)" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Active Deals</h3>
        <p className="text-(--color-text-muted) max-w-md mx-auto">
          Check back soon! We regularly add new flash deals and special offers.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  )
}

async function UpcomingDeals() {
  const supabase = await createClient()

  const { data: upcomingDeals } = await supabase
    .from('flash_deals')
    .select(`
      *,
      product:products(
        id,
        name,
        slug,
        image_url,
        price_pence
      )
    `)
    .eq('is_active', true)
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(4)

  if (!upcomingDeals || upcomingDeals.length === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-(--color-info-bg) rounded-xl flex items-center justify-center">
          <Clock className="h-5 w-5 text-(--color-info)" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
          <p className="text-sm text-(--color-text-muted)">Don't miss these upcoming deals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {upcomingDeals.map((deal) => (
          <div
            key={deal.id}
            className="bg-(--color-info-bg) rounded-xl p-4 border border-(--color-border)"
          >
            <div className="aspect-square relative bg-(--color-surface) rounded-lg overflow-hidden mb-3">
              {deal.product?.image_url && (
                <img
                  src={deal.product.image_url}
                  alt={deal.product.name}
                  className="object-cover w-full h-full"
                />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center text-(--color-text-inverse)">
                  <Clock className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-xs font-medium">Coming Soon</p>
                </div>
              </div>
            </div>
            <h3 className="font-medium text-foreground text-sm truncate">{deal.title}</h3>
            <p className="text-xs text-(--color-info) mt-1">
              Starts {new Date(deal.starts_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function DealsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-(--color-surface) overflow-hidden">
          <Skeleton className="aspect-4/3" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DealsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-(--brand-amber) text-(--color-text-inverse)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-(--color-surface)/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Flash Deals</h1>
              <p className="text-white/80">Limited time offers - Don't miss out!</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-(--color-surface)/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Flame className="h-5 w-5" />
              <span className="text-sm font-medium">Up to 50% Off</span>
            </div>
            <div className="flex items-center gap-2 bg-(--color-surface)/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Limited Time</span>
            </div>
            <div className="flex items-center gap-2 bg-(--color-surface)/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">New Deals Daily</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Deal Banner */}
        <div className="mb-8">
          <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
            <FeaturedDeal />
          </Suspense>
        </div>

        {/* All Active Deals */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-(--brand-amber-soft) rounded-xl flex items-center justify-center">
              <Flame className="h-5 w-5 text-(--brand-amber)" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Active Deals</h2>
              <p className="text-sm text-(--color-text-muted)">Grab them before they're gone</p>
            </div>
          </div>

          <Suspense fallback={<DealsSkeleton />}>
            <AllDeals />
          </Suspense>
        </section>

        {/* Upcoming Deals */}
        <Suspense fallback={null}>
          <UpcomingDeals />
        </Suspense>

        {/* Info Section */}
        <section className="mt-12 bg-(--brand-amber-soft) rounded-2xl p-8">
          <h2 className="text-xl font-bold text-foreground mb-4">How Flash Deals Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-(--color-surface) rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-(--brand-amber)">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Limited Quantities</h3>
                <p className="text-sm text-(--color-text-secondary)">Each deal has limited stock. First come, first served!</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-(--color-surface) rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-(--brand-amber)">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Time-Limited</h3>
                <p className="text-sm text-(--color-text-secondary)">Deals expire at the countdown end. Act fast!</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-(--color-surface) rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-(--brand-amber)">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Automatic Discount</h3>
                <p className="text-sm text-(--color-text-secondary)">Deal price applies automatically at checkout.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
