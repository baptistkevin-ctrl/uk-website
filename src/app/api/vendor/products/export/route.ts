import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('name, slug, description, price_pence, compare_at_price_pence, stock_quantity, low_stock_threshold, unit, sku, barcode, is_active, is_organic, is_gluten_free, is_vegan, is_vegetarian, image_url, created_at')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const headers = [
      'Name', 'Slug', 'Description', 'Price (£)', 'Compare At Price (£)',
      'Stock', 'Low Stock Alert', 'Unit', 'SKU', 'Barcode',
      'Active', 'Organic', 'Gluten Free', 'Vegan', 'Vegetarian',
      'Image URL', 'Created At'
    ]

    const rows = (products || []).map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.slug || '',
      `"${(p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      ((p.price_pence || 0) / 100).toFixed(2),
      p.compare_at_price_pence ? ((p.compare_at_price_pence) / 100).toFixed(2) : '',
      p.stock_quantity ?? 0,
      p.low_stock_threshold ?? 10,
      p.unit || 'each',
      p.sku || '',
      p.barcode || '',
      p.is_active ? 'Yes' : 'No',
      p.is_organic ? 'Yes' : 'No',
      p.is_gluten_free ? 'Yes' : 'No',
      p.is_vegan ? 'Yes' : 'No',
      p.is_vegetarian ? 'Yes' : 'No',
      p.image_url || '',
      p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : '',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const filename = `${vendor.business_name.replace(/[^a-zA-Z0-9]/g, '-')}-products-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Product export error:', error)
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 })
  }
}
