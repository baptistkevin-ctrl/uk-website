import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security";
import {
  ORDER_STATUSES,
  STATUS_DESCRIPTIONS,
  type OrderStatusKey,
  getStatusIndex,
  isStatusCompleted,
  getDemoDriver,
  simulateDriverLocation,
  simulateETA,
} from "@/lib/tracking/tracking-utils";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface OrderItem {
  id: string;
  quantity: number;
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  total_pence: number;
  delivery_fee_pence: number;
  delivery_address_line_1: string;
  delivery_address_line_2: string | null;
  delivery_city: string;
  delivery_postcode: string;
  delivery_slot_date: string | null;
  delivery_slot_from: string | null;
  delivery_slot_to: string | null;
  delivery_photo_url: string | null;
  user_id: string;
  order_items: OrderItem[];
}

/**
 * GET /api/orders/[id]/track
 *
 * Returns full tracking information for an authenticated user's order,
 * including timeline, simulated driver location, and ETA for dispatched orders.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimit = checkRateLimit(request, {
      limit: 30,
      windowMs: 60 * 1000,
      prefix: "order-track-live",
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await context.params;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        created_at,
        updated_at,
        confirmed_at,
        shipped_at,
        delivered_at,
        total_pence,
        delivery_fee_pence,
        delivery_address_line_1,
        delivery_address_line_2,
        delivery_city,
        delivery_postcode,
        delivery_slot_date,
        delivery_slot_from,
        delivery_slot_to,
        delivery_photo_url,
        user_id,
        order_items (
          id,
          quantity
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const typedOrder = order as unknown as OrderRow;

    if (typedOrder.user_id !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const itemCount = typedOrder.order_items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const deliverySlot =
      typedOrder.delivery_slot_date && typedOrder.delivery_slot_from && typedOrder.delivery_slot_to
        ? {
            date: typedOrder.delivery_slot_date,
            from: typedOrder.delivery_slot_from,
            to: typedOrder.delivery_slot_to,
          }
        : undefined;

    const timeline = buildTimeline(typedOrder);

    const isDispatched = typedOrder.status === "dispatched";

    const driver = isDispatched ? getDemoDriver(typedOrder.id) : null;

    const location = isDispatched
      ? {
          ...simulateDriverLocation(typedOrder.delivery_postcode),
          updatedAt: new Date().toISOString(),
        }
      : null;

    // ETA refinement — narrows as order progresses
    let eta = null;
    if (isDispatched) {
      eta = simulateETA();
    } else {
      // Provide estimated delivery window for non-dispatched orders
      const statusKey = typedOrder.status as string;
      const etaWindows: Record<string, { min: number; max: number; label: string }> = {
        pending: { min: 60, max: 120, label: 'Estimated delivery in 1-2 hours' },
        confirmed: { min: 45, max: 90, label: 'Estimated delivery in 45-90 minutes' },
        processing: { min: 20, max: 45, label: 'Estimated delivery in 20-45 minutes' },
      };
      const window = etaWindows[statusKey];
      if (window) {
        const avgMinutes = Math.round((window.min + window.max) / 2);
        eta = {
          minutes: avgMinutes,
          arrivalTime: new Date(Date.now() + avgMinutes * 60 * 1000).toISOString(),
          distance: '',
          trafficLevel: 'low' as const,
          window: window.label,
        };
      }
    }

    const response = {
      order: {
        id: typedOrder.id,
        orderNumber: typedOrder.order_number,
        status: typedOrder.status,
        createdAt: typedOrder.created_at,
        updatedAt: typedOrder.updated_at,
        total: typedOrder.total_pence / 100,
        deliveryFee: typedOrder.delivery_fee_pence / 100,
        itemCount,
        deliveryAddress: {
          line1: typedOrder.delivery_address_line_1,
          line2: typedOrder.delivery_address_line_2 ?? undefined,
          city: typedOrder.delivery_city,
          postcode: typedOrder.delivery_postcode,
        },
        deliverySlot,
        deliveryPhotoUrl: typedOrder.delivery_photo_url,
      },
      timeline,
      driver,
      location,
      eta,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking information" },
      { status: 500 }
    );
  }
}

/**
 * Builds the status timeline from the order record.
 * Each step includes whether it's completed, current, and its timestamp.
 */
function buildTimeline(order: OrderRow) {
  const currentIdx = getStatusIndex(order.status);

  const timestampMap: Record<string, string | null> = {
    pending: order.created_at,
    confirmed: order.confirmed_at,
    processing: order.confirmed_at
      ? estimateProcessingTime(order.confirmed_at)
      : null,
    dispatched: order.shipped_at,
    delivered: order.delivered_at,
  };

  return ORDER_STATUSES.map((step, idx) => {
    const completed = isStatusCompleted(order.status, step.key);
    const current = idx === currentIdx;

    let timestamp = timestampMap[step.key] ?? null;
    if (!completed && !current) {
      timestamp = null;
    }

    return {
      status: step.key,
      label: step.label,
      icon: step.icon,
      description: STATUS_DESCRIPTIONS[step.key as OrderStatusKey],
      timestamp,
      completed,
      current,
    };
  });
}

/**
 * Estimates a processing start time as 15 minutes after confirmation.
 * Used when a dedicated processing timestamp column doesn't exist.
 */
function estimateProcessingTime(confirmedAt: string): string {
  const date = new Date(confirmedAt);
  date.setMinutes(date.getMinutes() + 15);
  return date.toISOString();
}
