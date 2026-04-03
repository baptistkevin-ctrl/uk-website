import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get user's invoices
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')

    let query = supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    return NextResponse.json({ invoices: invoices || [] })
  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Generate invoice for an order (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('order_id', order_id)
      .single()

    if (existingInvoice) {
      return NextResponse.json({
        invoice: existingInvoice,
        message: 'Invoice already exists for this order'
      })
    }

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number')
    const invNumber = invoiceNumber || `INV-${Date.now()}`

    // Calculate VAT
    const vatRate = 20
    const vatAmount = Math.round(order.total_pence * vatRate / (100 + vatRate))

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invNumber,
        order_id: order.id,
        user_id: order.user_id,
        billing_name: order.shipping_address?.name || 'Customer',
        billing_email: order.shipping_address?.email || '',
        billing_address: order.shipping_address,
        billing_phone: order.shipping_address?.phone,
        subtotal_pence: order.subtotal_pence,
        discount_pence: order.discount_pence || 0,
        shipping_pence: order.shipping_pence || 0,
        tax_pence: vatAmount,
        total_pence: order.total_pence,
        vat_rate: vatRate,
        vat_amount_pence: vatAmount,
        status: order.payment_status === 'paid' ? 'paid' : 'issued',
        paid_date: order.payment_status === 'paid' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create invoice items
    const invoiceItems = order.items.map((item: any) => ({
      invoice_id: invoice.id,
      product_id: item.product_id,
      description: item.product_name,
      quantity: item.quantity,
      unit_price_pence: item.price_pence,
      total_pence: item.quantity * item.price_pence,
      vat_rate: vatRate,
      vat_amount_pence: Math.round((item.quantity * item.price_pence) * vatRate / (100 + vatRate))
    }))

    await supabase.from('invoice_items').insert(invoiceItems)

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
