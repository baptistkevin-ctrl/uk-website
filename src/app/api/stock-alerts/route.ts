import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:stock-alerts' })

export const dynamic = 'force-dynamic'

// Get user's stock alerts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: alerts, error } = await supabase
      .from('stock_alerts')
      .select(`
        *,
        product:products(
          id,
          name,
          slug,
          image_url,
          price_pence,
          stock_quantity,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      log.error('Error fetching stock alerts', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    log.error('Get stock alerts error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Subscribe to stock alert
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { product_id, email, phone, notify_via } = body

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    const alertEmail = email || user?.email

    if (!alertEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if product exists and is out of stock
    const { data: product } = await supabase
      .from('products')
      .select('id, stock_quantity, name')
      .eq('id', product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.stock_quantity > 0) {
      return NextResponse.json({ error: 'Product is in stock' }, { status: 400 })
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('stock_alerts')
      .select('id')
      .eq('product_id', product_id)
      .eq('email', alertEmail)
      .single()

    if (existing) {
      return NextResponse.json({
        message: 'You are already subscribed to alerts for this product'
      })
    }

    // Create stock alert
    const { data: alert, error } = await supabase
      .from('stock_alerts')
      .insert({
        product_id,
        user_id: user?.id || null,
        email: alertEmail,
        phone: phone || null,
        notify_via: notify_via || 'email',
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      log.error('Error creating stock alert', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    return NextResponse.json({
      alert,
      message: `We'll notify you at ${alertEmail} when "${product.name}" is back in stock!`
    })
  } catch (error) {
    log.error('Create stock alert error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete stock alert
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('stock_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user?.id)

    if (error) {
      log.error('Error deleting stock alert', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Delete stock alert error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
