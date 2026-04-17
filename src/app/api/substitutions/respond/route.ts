import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { z } from "zod";

const responseSchema = z.object({
  orderId: z.string().uuid(),
  originalProductId: z.string().uuid(),
  action: z.enum(["accept", "reject", "accept_alternative"]),
  alternativeProductId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = responseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid substitution response",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { orderId, originalProductId, action, alternativeProductId } =
      parsed.data;

    // Validate that accept_alternative includes an alternativeProductId
    if (action === "accept_alternative" && !alternativeProductId) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message:
            "alternativeProductId is required when action is accept_alternative",
        },
        { status: 400 }
      );
    }

    // Verify the order belongs to this user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "You do not own this order" },
        { status: 403 }
      );
    }

    // Verify the original product exists in this order
    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .select("id")
      .eq("order_id", orderId)
      .eq("product_id", originalProductId)
      .single();

    if (itemError || !orderItem) {
      return NextResponse.json(
        {
          code: "NOT_FOUND",
          message: "Product not found in this order",
        },
        { status: 404 }
      );
    }

    // If accepting an alternative, verify it exists and is in stock
    if (action === "accept_alternative" && alternativeProductId) {
      const { data: altProduct, error: altError } = await supabase
        .from("products")
        .select("id, is_active, stock_quantity")
        .eq("id", alternativeProductId)
        .single();

      if (altError || !altProduct) {
        return NextResponse.json(
          {
            code: "NOT_FOUND",
            message: "Alternative product not found",
          },
          { status: 404 }
        );
      }

      if (!altProduct.is_active) {
        return NextResponse.json(
          {
            code: "UNAVAILABLE",
            message: "Alternative product is no longer available",
          },
          { status: 409 }
        );
      }

      if (
        altProduct.stock_quantity !== null &&
        altProduct.stock_quantity <= 0
      ) {
        return NextResponse.json(
          {
            code: "OUT_OF_STOCK",
            message: "Alternative product is out of stock",
          },
          { status: 409 }
        );
      }
    }

    // Record the substitution response for ML training data
    const { error: insertError } = await supabase
      .from("substitution_responses")
      .insert({
        user_id: user.id,
        order_id: orderId,
        original_product_id: originalProductId,
        action,
        alternative_product_id: alternativeProductId ?? null,
        responded_at: new Date().toISOString(),
      });

    // Log insert failure but don't block the response
    if (insertError) {
      console.error(
        "Failed to record substitution response:",
        insertError.message
      );
    }

    // Apply the substitution to the order if accepted
    if (action === "accept" || action === "accept_alternative") {
      const substituteId =
        action === "accept_alternative"
          ? alternativeProductId
          : null;

      if (substituteId) {
        // Fetch the substitute product details for the order item update
        const { data: subProduct } = await supabase
          .from("products")
          .select("name, price_pence, image_url")
          .eq("id", substituteId)
          .single();

        if (subProduct) {
          await supabase
            .from("order_items")
            .update({
              product_id: substituteId,
              name: subProduct.name,
              price_pence: subProduct.price_pence,
              image_url: subProduct.image_url,
              substituted_from: originalProductId,
            })
            .eq("order_id", orderId)
            .eq("product_id", originalProductId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      action,
      orderId,
      originalProductId,
      alternativeProductId: alternativeProductId ?? null,
      message:
        action === "reject"
          ? "Substitution rejected — item will be removed from your order"
          : action === "accept_alternative"
            ? "Alternative substitution accepted"
            : "Suggested substitution accepted",
    });
  } catch {
    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: "Failed to process substitution response",
      },
      { status: 500 }
    );
  }
}
