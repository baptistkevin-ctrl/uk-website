import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

import { CHARITIES } from "@/lib/loyalty/gamification-engine"

export const dynamic = "force-dynamic"

// POST /api/loyalty/charity-roundup — record a charity round-up donation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Authentication required", details: null },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { charityId, amount, orderId } = body as {
      charityId: string
      amount: number
      orderId: string
    }

    // Validate charity ID
    if (!charityId || !CHARITIES.some(c => c.id === charityId)) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Invalid charity ID", details: { validIds: CHARITIES.map(c => c.id) } },
        { status: 400 }
      )
    }

    // Validate amount (pence, positive integer, max 100 pence = £1 round-up)
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1 || amount > 100) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Amount must be 1-100 pence", details: null },
        { status: 400 }
      )
    }

    // Validate order ID
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Order ID is required", details: null },
        { status: 400 }
      )
    }

    // Verify the order belongs to this user
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()

    if (!order) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Order not found", details: null },
        { status: 404 }
      )
    }

    // Prevent duplicate round-ups on the same order
    const { data: existing } = await supabase
      .from("charity_roundups")
      .select("id")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { code: "CONFLICT", message: "Round-up already recorded for this order", details: null },
        { status: 409 }
      )
    }

    // Insert the round-up record
    const { error: insertError } = await supabase
      .from("charity_roundups")
      .insert({
        user_id: user.id,
        order_id: orderId,
        charity_id: charityId,
        amount_pence: amount,
      })

    if (insertError) {
      console.error("[charity-roundup] Insert error:", insertError)
      return NextResponse.json(
        { code: "INTERNAL_ERROR", message: "Failed to record donation", details: null },
        { status: 500 }
      )
    }

    const charity = CHARITIES.find(c => c.id === charityId)

    return NextResponse.json({
      success: true,
      message: `${amount}p donated to ${charity?.name ?? charityId}`,
      charityId,
      amountPence: amount,
      orderId,
    })
  } catch (error) {
    console.error("[charity-roundup] Error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to process round-up", details: null },
      { status: 500 }
    )
  }
}
