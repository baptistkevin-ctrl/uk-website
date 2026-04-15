import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { calculateBasketCarbon } from '@/lib/carbon/carbon-data'

export const dynamic = 'force-dynamic'

interface BasketRequestItem {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as { items: BasketRequestItem[] }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (items.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 items per request' },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json(
          { error: 'Each item must have a valid productId' },
          { status: 400 }
        )
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a quantity >= 1' },
          { status: 400 }
        )
      }
    }

    const productIds = items.map((item) => item.productId)

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch products with their categories
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, unit, dietary_info, product_categories(categories(slug))')
      .in('id', productIds)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch product data' },
        { status: 500 }
      )
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No valid products found' },
        { status: 404 }
      )
    }

    // Build a lookup map: productId -> product data
    const productMap = new Map<string, typeof products[number]>()
    for (const product of products) {
      productMap.set(product.id, product)
    }

    // Build basket items for carbon calculation
    const basketItems = items
      .filter((item) => productMap.has(item.productId))
      .map((item) => {
        const product = productMap.get(item.productId)!

        // Extract first category slug
        const categories = product.product_categories as unknown as Array<{
          categories: { slug: string } | null
        }> | null
        const categorySlug = categories?.[0]?.categories?.slug

        // Check if organic from dietary_info
        const dietaryInfo = product.dietary_info as Record<string, boolean> | null
        const isOrganic = dietaryInfo?.organic === true

        return {
          name: product.name,
          quantity: item.quantity,
          unit: product.unit ?? undefined,
          is_organic: isOrganic,
          category_slug: categorySlug,
        }
      })

    const result = calculateBasketCarbon(basketItems)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to calculate basket carbon footprint' },
      { status: 500 }
    )
  }
}
