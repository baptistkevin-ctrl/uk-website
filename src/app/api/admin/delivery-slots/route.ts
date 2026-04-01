import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// GET all delivery slots
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin
    .from('delivery_slots')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (startDate) {
    query = query.gte('date', startDate)
  }

  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching delivery slots:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery slots' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create new delivery slot
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { date, start_time, end_time, max_orders, delivery_fee_pence, is_available } = body

    if (!date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Date, start time, and end time are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_slots')
      .insert({
        date,
        start_time,
        end_time,
        max_orders: max_orders || 20,
        delivery_fee_pence: delivery_fee_pence || 399,
        is_available: is_available !== false,
        current_orders: 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A slot with this date and time already exists' },
          { status: 409 }
        )
      }
      console.error('Error creating delivery slot:', error)
      return NextResponse.json({ error: 'Failed to create delivery slot' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update delivery slot
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 })
    }

    const allowedFields = ['date', 'start_time', 'end_time', 'max_orders', 'delivery_fee_pence', 'is_available']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field]
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_slots')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating delivery slot:', error)
      return NextResponse.json({ error: 'Failed to update delivery slot' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete delivery slot
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 })
  }

  // Check if slot has orders
  const { data: slot } = await supabaseAdmin
    .from('delivery_slots')
    .select('current_orders')
    .eq('id', id)
    .single()

  if (slot && slot.current_orders > 0) {
    return NextResponse.json(
      { error: 'Cannot delete slot with existing orders' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('delivery_slots')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting delivery slot:', error)
    return NextResponse.json({ error: 'Failed to delete delivery slot' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
