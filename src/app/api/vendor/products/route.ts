import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET vendor's products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Get vendor
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Build query
    let query = supabaseAdmin
      .from('products')
      .select('*, product_categories(categories(id, name))')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (status === 'low_stock') {
      query = query.lt('stock_quantity', 10)
    }

    const { data: products, error: productsError } = await query

    if (productsError) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Vendor products error:', error)
    return NextResponse.json({ error: 'Failed to get products' }, { status: 500 })
  }
}

// CREATE new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Get vendor
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id, stripe_onboarding_complete')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Require Stripe onboarding
    if (!vendor.stripe_onboarding_complete) {
      return NextResponse.json({
        error: 'Please complete Stripe setup before adding products'
      }, { status: 400 })
    }

    const {
      name,
      description,
      price_pence,
      compare_at_price_pence,
      category_id,
      stock_quantity,
      low_stock_threshold,
      unit,
      image_url,
      images,
      sku,
      barcode,
      is_organic,
      is_gluten_free,
      is_vegan,
      is_vegetarian,
    } = body

    if (!name || !price_pence) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

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

    // Create product (category_id is NOT a column in products - it's in product_categories)
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        vendor_id: vendor.id,
        name,
        slug,
        description,
        price_pence,
        compare_at_price_pence: compare_at_price_pence || null,
        stock_quantity: stock_quantity || 0,
        low_stock_threshold: low_stock_threshold || 10,
        unit: unit || 'each',
        image_url,
        images: images || [],
        sku: sku || null,
        barcode: barcode || null,
        is_active: true,
        is_organic: is_organic || false,
        is_gluten_free: is_gluten_free || false,
        is_vegan: is_vegan || false,
        is_vegetarian: is_vegetarian || false,
      })
      .select()
      .single()

    if (productError) {
      console.error('Product creation error:', productError)
      return NextResponse.json({ error: 'Failed to create product', details: productError.message }, { status: 500 })
    }

    // Link product to category if provided
    if (category_id && product) {
      await supabaseAdmin
        .from('product_categories')
        .insert({
          product_id: product.id,
          category_id: category_id,
        })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// UPDATE product
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Get vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Verify product belongs to vendor
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single()

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Price fields should already be in pence from the client
    // Rename to match database column names if client sends different keys
    if (updates.price !== undefined) {
      updates.price_pence = updates.price
      delete updates.price
    }
    if (updates.compare_at_price !== undefined) {
      updates.compare_at_price_pence = updates.compare_at_price
      delete updates.compare_at_price
    }

    // Update product
    const { data: product, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE product
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Get vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Delete product (only if belongs to vendor)
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .eq('vendor_id', vendor.id)

    if (deleteError) {
      // FK constraint — product has order_items, soft-delete instead
      if (deleteError.code === '23503') {
        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update({ is_active: false })
          .eq('id', id)
          .eq('vendor_id', vendor.id)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 })
        }
        return NextResponse.json({ success: true, softDeleted: true })
      }
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
