import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:brands' })

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const featured = searchParams.get('featured') === 'true'
  const limit = parseInt(searchParams.get('limit') || '50')

  const supabase = getSupabaseAdmin()

  try {
    // Get all products with brands
    const { data: products, error } = await supabase
      .from('products')
      .select('brand, price_pence, image_url')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .not('brand', 'is', null)
      .not('brand', 'eq', '')

    if (error) {
      log.error('Error fetching brands', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
    }

    // Aggregate brands with product counts and sample images
    const brandMap = new Map<string, { count: number; images: string[] }>()

    products?.forEach(product => {
      if (product.brand) {
        const brandLower = product.brand
        if (!brandMap.has(brandLower)) {
          brandMap.set(brandLower, { count: 0, images: [] })
        }
        const brand = brandMap.get(brandLower)!
        brand.count++
        if (product.image_url && brand.images.length < 4) {
          brand.images.push(product.image_url)
        }
      }
    })

    // Convert to array and sort by product count
    let brands = Array.from(brandMap.entries())
      .map(([name, data]) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        product_count: data.count,
        images: data.images,
      }))
      .sort((a, b) => b.product_count - a.product_count)

    // If featured, return top brands only
    if (featured) {
      brands = brands.filter(b => b.product_count >= 3).slice(0, 12)
    } else {
      brands = brands.slice(0, limit)
    }

    return NextResponse.json(brands)
  } catch (error) {
    log.error('Error fetching brands', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}
