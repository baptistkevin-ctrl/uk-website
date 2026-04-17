import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { cacheInvalidateTag } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, stripe_onboarding_complete')
      .eq('user_id', user.id)
      .single()

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const body = await request.json()
    const { products: rows } = body

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No products to import' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 products per import' }, { status: 400 })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        const name = row.name?.trim()
        if (!name) { errors.push('Row skipped: missing name'); errorCount++; continue }

        const parsedPrice = parseFloat(row.price || '0')
        if (isNaN(parsedPrice) || parsedPrice <= 0) { errors.push(`"${name}": invalid or missing price`); errorCount++; continue }
        const pricePence = Math.round(parsedPrice * 100)

        // Generate slug
        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        let slug = baseSlug
        let counter = 1
        while (true) {
          const { data: existing } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('slug', slug)
            .single()
          if (!existing) break
          slug = `${baseSlug}-${counter}`
          counter++
        }

        const { error: insertError } = await supabaseAdmin
          .from('products')
          .insert({
            vendor_id: vendor.id,
            name,
            slug,
            short_description: row.short_description || null,
            description: row.description || null,
            price_pence: pricePence,
            compare_at_price_pence: row.compare_at_price && !isNaN(parseFloat(row.compare_at_price)) ? Math.round(parseFloat(row.compare_at_price) * 100) : null,
            stock_quantity: parseInt(row.stock_quantity || '0') || 0,
            low_stock_threshold: parseInt(row.low_stock_threshold || '10') || 10,
            unit: row.unit || 'each',
            sku: row.sku || null,
            barcode: row.barcode || null,
            brand: row.brand || null,
            is_active: true,
            is_organic: String(row.is_organic).toLowerCase() === 'yes' || row.is_organic === true,
            is_gluten_free: String(row.is_gluten_free).toLowerCase() === 'yes' || row.is_gluten_free === true,
            is_vegan: String(row.is_vegan).toLowerCase() === 'yes' || row.is_vegan === true,
            is_vegetarian: String(row.is_vegetarian).toLowerCase() === 'yes' || row.is_vegetarian === true,
          })

        if (insertError) {
          errors.push(`"${name}": ${insertError.message}`)
          errorCount++
        } else {
          successCount++
        }
      } catch (err) {
        errorCount++
        errors.push(`Row error: ${err}`)
      }
    }

    await cacheInvalidateTag('products')

    return NextResponse.json({
      success: true,
      imported: successCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 20),
      total: rows.length,
    })
  } catch (error) {
    console.error('Vendor product import error:', error)
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 })
  }
}
