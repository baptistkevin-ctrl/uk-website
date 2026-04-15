import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { estimateProductCarbon, formatCo2 } from '@/lib/carbon/carbon-data'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Valid product ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('id, name, unit, is_organic, is_vegan, is_vegetarian, is_gluten_free')
      .eq('id', id)
      .single()

    // Get category slug
    const { data: catLink } = await supabaseAdmin
      .from('product_categories')
      .select('categories(slug)')
      .eq('product_id', id)
      .limit(1)
      .maybeSingle()

    const categorySlug = (catLink as any)?.categories?.slug ?? undefined

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const carbon = estimateProductCarbon({
      name: product.name,
      unit: product.unit ?? undefined,
      is_organic: product.is_organic ?? false,
      category_slug: categorySlug,
    })

    return NextResponse.json({
      success: true,
      productId: product.id,
      productName: product.name,
      co2Kg: carbon.co2Kg,
      co2Formatted: formatCo2(carbon.co2Kg),
      rating: carbon.rating,
      foodMiles: carbon.foodMiles ?? null,
      origin: carbon.origin ?? null,
      isOrganic: product.is_organic ?? false,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to calculate product carbon footprint' },
      { status: 500 }
    )
  }
}
