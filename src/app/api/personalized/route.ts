import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { cached, TTL } from '@/lib/cache'
import { captureError } from '@/lib/error-tracking'
import {
  getPersonalizationContext,
  getPersonalizedSections,
  getGreeting,
  getSeasonalBanner,
  type PersonalizedSection,
} from '@/lib/personalization/personalization-engine'

export const dynamic = 'force-dynamic'

interface ProductRow {
  id: string
  name: string
  slug: string
  price_pence: number
  compare_at_price_pence: number | null
  image_url: string | null
  brand: string | null
  is_organic: boolean
}

const MAX_SECTIONS = 3
const PRODUCTS_PER_SECTION = 8

async function fetchSectionProducts(
  section: PersonalizedSection,
): Promise<ProductRow[]> {
  const supabase = getSupabaseAdmin()

  // Deals section: products with a compare_at_price (on sale)
  if (section.id === "deals-for-you") {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, price_pence, compare_at_price_pence, image_url, brand, is_organic')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .not('compare_at_price_pence', 'is', null)
      .limit(PRODUCTS_PER_SECTION)

    if (error) throw error
    return (data ?? []) as ProductRow[]
  }

  // Standard section: match products by search terms via ilike
  if (section.searchTerms.length === 0) return []

  const orFilter = section.searchTerms
    .map((term) => `name.ilike.%${term}%`)
    .join(',')

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price_pence, compare_at_price_pence, image_url, brand, is_organic')
    .or(orFilter)
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .limit(PRODUCTS_PER_SECTION)

  if (error) throw error
  return (data ?? []) as ProductRow[]
}

export async function GET() {
  try {
    const ctx = getPersonalizationContext()
    const allSections = getPersonalizedSections(ctx)
    const topSections = allSections.slice(0, MAX_SECTIONS)

    // Resolve the authenticated user's name (best-effort, non-blocking)
    let userName: string | undefined
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          userName = profile.full_name.split(' ')[0]
        }
      }
    } catch {
      // Anonymous visitor — greeting without name
    }

    // Build a stable cache key from context (weather has randomness so we include it)
    const cacheKey = `personalized:${ctx.timeOfDay}:${ctx.season}:${ctx.weatherMood}:${ctx.isWeekend}`

    const sectionsWithProducts = await cached(
      cacheKey,
      async () => {
        const results = await Promise.all(
          topSections.map(async (section) => {
            const rawProducts = await fetchSectionProducts(section)
            const products = rawProducts.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              imageUrl: p.image_url ?? '',
              price: (p.price_pence ?? 0) / 100,
              originalPrice: p.compare_at_price_pence ? p.compare_at_price_pence / 100 : undefined,
              isOrganic: p.is_organic ?? false,
              onSale: !!p.compare_at_price_pence,
              brand: p.brand,
            }))
            return {
              id: section.id,
              title: section.title,
              subtitle: section.subtitle,
              icon: section.icon,
              products,
            }
          }),
        )

        // Only return sections that actually have products
        return results.filter((s) => s.products.length > 0)
      },
      TTL.SHORT,
      ['personalized', `time:${ctx.timeOfDay}`, `season:${ctx.season}`],
    )

    const greeting = getGreeting(userName)
    const seasonalBanner = getSeasonalBanner(ctx)

    return NextResponse.json(
      {
        greeting,
        context: {
          timeOfDay: ctx.timeOfDay,
          season: ctx.season,
          weatherMood: ctx.weatherMood,
          isWeekend: ctx.isWeekend,
        },
        sections: sectionsWithProducts,
        seasonalBanner,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    )
  } catch (error) {
    console.error('Personalized API error:', error)
    captureError(
      error instanceof Error ? error : new Error(String(error)),
      { context: 'api:personalized:get' },
    )
    return NextResponse.json(
      { error: 'Failed to fetch personalized content' },
      { status: 500 },
    )
  }
}
