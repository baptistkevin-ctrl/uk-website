import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { cached, TTL } from "@/lib/cache"
import { captureError } from "@/lib/error-tracking"
import {
  simulateUKWeather,
  getWeatherPromotions,
  type WeatherState,
  type WeatherPromotion,
} from "@/lib/weather/weather-engine"

export const dynamic = "force-dynamic"

const MAX_PROMO_PRODUCTS = 2
const PRODUCTS_PER_PROMO = 8

interface ProductRow {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  unit: string | null
  unit_value: number | null
  is_active: boolean
}

async function fetchProductsForPromo(
  terms: string[]
): Promise<ProductRow[]> {
  const supabase = getSupabaseAdmin()

  // Build an OR filter matching any search term against the product name
  const orFilter = terms
    .map((term) => `name.ilike.%${term}%`)
    .join(",")

  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, price_pence, image_url, unit, unit_value, is_active")
    .eq("is_active", true)
    .or(orFilter)
    .order("created_at", { ascending: false })
    .limit(PRODUCTS_PER_PROMO)

  if (error) {
    captureError(error, { context: "weather-product-fetch" })
    return []
  }

  return (data as ProductRow[]) ?? []
}

export async function GET() {
  try {
    const result = await cached(
      "api:weather:data",
      async () => {
        const weather: WeatherState = simulateUKWeather()
        const promotions: WeatherPromotion[] = getWeatherPromotions(weather)

        // Fetch products for top promotions only (avoid hammering DB)
        const topPromos = promotions.slice(0, MAX_PROMO_PRODUCTS)
        const productEntries = await Promise.all(
          topPromos.map(async (promo) => {
            const products = await fetchProductsForPromo(promo.searchTerms)
            return [promo.id, products] as const
          })
        )

        const products: Record<string, ProductRow[]> =
          Object.fromEntries(productEntries)

        return { weather, promotions, products }
      },
      TTL.VERY_LONG, // 30 minutes — weather doesn't change fast
      ["weather"]
    )

    return NextResponse.json(result)
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      context: "weather-api",
    })

    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    )
  }
}
