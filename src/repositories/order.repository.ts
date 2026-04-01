/**
 * Order Repository — Solaris Data Layer
 *
 * ONLY database queries live here. No business logic.
 * Services call repositories, repositories talk to the database.
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'repo:orders' })

// Column lists — NEVER SELECT *
const ORDER_COLUMNS = `
  id, order_number, user_id, customer_email, customer_name,
  status, payment_status, subtotal_pence, delivery_fee_pence,
  discount_pence, total_pence, shipping_address, billing_address,
  delivery_slot, notes, stripe_checkout_session_id, stripe_payment_intent_id,
  vendor_id, shipped_at, delivered_at, cancelled_at,
  created_at, updated_at
` as const

const ORDER_ITEM_COLUMNS = `
  id, order_id, product_id, product_name, product_image,
  quantity, unit_price_pence, total_price_pence, vendor_id
` as const

const ORDER_LIST_COLUMNS = `
  id, order_number, customer_name, customer_email,
  status, payment_status, total_pence, created_at, updated_at
` as const

export const orderRepository = {
  async findById(id: string) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      log.error('Failed to find order', { id, error: error.message })
      throw error
    }
    return data
  },

  async findItemsByOrderId(orderId: string) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('order_items')
      .select(ORDER_ITEM_COLUMNS)
      .eq('order_id', orderId)

    if (error) {
      log.error('Failed to find order items', { orderId, error: error.message })
      throw error
    }
    return data || []
  },

  async findMany(params: {
    page: number
    limit: number
    status?: string
    userId?: string
    paymentStatus?: string
    search?: string
  }) {
    const supabase = getSupabaseAdmin()
    const offset = (params.page - 1) * params.limit

    let query = supabase
      .from('orders')
      .select(ORDER_LIST_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + params.limit - 1)

    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.userId) {
      query = query.eq('user_id', params.userId)
    }
    if (params.paymentStatus) {
      query = query.eq('payment_status', params.paymentStatus)
    }
    if (params.search) {
      query = query.or(
        `order_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%`
      )
    }

    const { data, error, count } = await query

    if (error) {
      log.error('Failed to list orders', { error: error.message })
      throw error
    }

    return { data: data || [], total: count || 0 }
  },

  async findByStatus(status: string) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, order_number')
      .eq('status', status)

    if (error) throw error
    return data || []
  },

  async update(id: string, fields: Record<string, unknown>) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('orders')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(ORDER_COLUMNS)
      .single()

    if (error) {
      log.error('Failed to update order', { id, error: error.message })
      throw error
    }
    return data
  },

  async deleteItems(orderId: string) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (error) {
      log.error('Failed to delete order items', { orderId, error: error.message })
      throw error
    }
  },

  async deleteOrder(id: string) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) {
      log.error('Failed to delete order', { id, error: error.message })
      throw error
    }
  },
}
