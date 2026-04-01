import { ok, fail, type Result } from "@/lib/utils/result"
import { logger } from "@/lib/utils/logger"
import { getSupabaseAdmin } from "@/lib/supabase/server"

const DEFAULT_COMMISSION_RATE = 0.125 // 12.5%

const log = logger.child({ service: "commission" })

export const commissionService = {
  async calculateSplit(
    orderTotalPence: number,
    vendorId: string
  ): Promise<{ platformPence: number; vendorPence: number; rate: number }> {
    // Get vendor-specific commission rate, fallback to default
    const { data: vendor } = await getSupabaseAdmin()
      .from("vendors")
      .select("commission_rate")
      .eq("id", vendorId)
      .single()

    const rate = vendor?.commission_rate || DEFAULT_COMMISSION_RATE

    // Platform fee: round to nearest penny
    const platformPence = Math.round(orderTotalPence * rate)
    // Vendor gets the remainder (ensures amounts add up exactly)
    const vendorPence = orderTotalPence - platformPence

    return { platformPence, vendorPence, rate }
  },

  async recordCommission(params: {
    orderId: string
    vendorId: string
    orderTotalPence: number
    platformPence: number
    vendorPence: number
    rate: number
    stripePaymentIntentId?: string
  }): Promise<Result<{ id: string }>> {
    const { data, error } = await getSupabaseAdmin()
      .from("commissions")
      .insert({
        order_id: params.orderId,
        vendor_id: params.vendorId,
        order_total_pence: params.orderTotalPence,
        platform_fee_pence: params.platformPence,
        vendor_amount_pence: params.vendorPence,
        commission_rate: params.rate,
        stripe_payment_intent_id: params.stripePaymentIntentId,
        status: "pending",
      })
      .select("id")
      .single()

    if (error) return fail("Failed to record commission", "INTERNAL_ERROR")

    log.info("Commission recorded", {
      orderId: params.orderId,
      vendorId: params.vendorId,
      total: params.orderTotalPence,
      platform: params.platformPence,
      vendor: params.vendorPence,
      rate: params.rate,
    })

    return ok({ id: data.id })
  },

  async processRefund(
    orderId: string,
    refundAmountPence: number
  ): Promise<Result<{ platformRefundPence: number; vendorRefundPence: number }>> {
    const { data: commission } = await getSupabaseAdmin()
      .from("commissions")
      .select("*")
      .eq("order_id", orderId)
      .single()

    if (!commission) return fail("Commission record not found", "NOT_FOUND")

    // Proportional refund
    const refundRate = refundAmountPence / commission.order_total_pence
    const platformRefundPence = Math.round(commission.platform_fee_pence * refundRate)
    const vendorRefundPence = refundAmountPence - platformRefundPence

    const isFullRefund = refundAmountPence === commission.order_total_pence

    await getSupabaseAdmin()
      .from("commissions")
      .update({
        status: isFullRefund ? "refunded" : "partially_refunded",
        refunded_amount_pence: refundAmountPence,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commission.id)

    log.info("Commission refund processed", {
      orderId,
      refundAmount: refundAmountPence,
      platformRefund: platformRefundPence,
      vendorRefund: vendorRefundPence,
      isFullRefund,
    })

    return ok({ platformRefundPence, vendorRefundPence })
  },
}
