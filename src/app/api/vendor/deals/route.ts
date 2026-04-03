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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get vendor's products
    const { data: vendorProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('vendor_id', vendor.id)

    const productIds = vendorProducts?.map(p => p.id) || []

    if (productIds.length === 0) {
      return NextResponse.json({ deals: [], products: [] })
    }

    // Get deals for vendor's products
    const { data: deals, error } = await supabaseAdmin
      .from('flash_deals')
      .select(`
        *,
        products:product_id (id, name, slug, image_url, price_pence)
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Vendor deals error:', error)
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
    }

    // Get products for deal creation
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, image_url, price_pence')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .order('name')

    return NextResponse.json({
      deals: deals || [],
      products: products || []
    })
  } catch (error) {
    console.error('Vendor deals error:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      product_id,
      deal_price_pence,
      starts_at,
      ends_at,
      max_quantity,
    } = body

    if (!title || !product_id || !deal_price_pence || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'Title, product, deal price, start and end dates are required' }, { status: 400 })
    }

    // Verify product belongs to vendor
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, price_pence, name')
      .eq('id', product_id)
      .eq('vendor_id', vendor.id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Create slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data: deal, error } = await supabaseAdmin
      .from('flash_deals')
      .insert({
        title,
        slug,
        description: description || null,
        product_id,
        deal_price_pence: parseInt(deal_price_pence),
        original_price_pence: product.price_pence,
        starts_at,
        ends_at,
        max_quantity: max_quantity || null,
        claimed_quantity: 0,
        is_active: true,
        is_featured: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Create deal error:', error)
      return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
    }

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Vendor deal create error:', error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Deal ID required' }, { status: 400 })
    }

    // Verify deal belongs to vendor's product
    const { data: deal } = await supabaseAdmin
      .from('flash_deals')
      .select('product_id')
      .eq('id', id)
      .single()

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', deal.product_id)
      .eq('vendor_id', vendor.id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('flash_deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
    }

    return NextResponse.json({ deal: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Deal ID required' }, { status: 400 })
    }

    // Verify ownership through product
    const { data: deal } = await supabaseAdmin
      .from('flash_deals')
      .select('product_id')
      .eq('id', id)
      .single()

    if (deal) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', deal.product_id)
        .eq('vendor_id', vendor.id)
        .single()

      if (!product) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    }

    await supabaseAdmin.from('flash_deals').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 })
  }
}
