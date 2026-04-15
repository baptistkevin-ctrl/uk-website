import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security";
import {
  getPostcodeCoords,
  moveToward,
  formatETA,
} from "@/lib/tracking/tracking-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const simulateBodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * POST /api/orders/[id]/track/simulate
 *
 * Simulates a driver location update for demo/testing purposes.
 * Accepts the driver's current lat/lng and returns a new position
 * moved slightly toward the delivery address, plus an updated ETA.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimit = checkRateLimit(request, {
      limit: 60,
      windowMs: 60 * 1000,
      prefix: "order-track-simulate",
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

    const body = await request.json();
    const parsed = simulateBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body. Provide lat and lng as numbers.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lat, lng } = parsed.data;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, status, delivery_postcode")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "dispatched") {
      return NextResponse.json(
        { error: "Simulation is only available for dispatched orders" },
        { status: 400 }
      );
    }

    const destination = getPostcodeCoords(order.delivery_postcode);
    const newPosition = moveToward({ lat, lng }, destination, 0.1);

    const distLat = destination.lat - newPosition.lat;
    const distLng = destination.lng - newPosition.lng;
    const distDegrees = Math.sqrt(distLat * distLat + distLng * distLng);
    const distKm = distDegrees * 111;
    const distMiles = distKm * 0.621371;

    const speedMph = 15 + Math.random() * 10;
    const etaMinutes = Math.max(1, Math.round((distMiles / speedMph) * 60));

    const arrival = new Date(Date.now() + etaMinutes * 60 * 1000);

    const trafficLevel: "low" | "moderate" | "heavy" =
      etaMinutes <= 10 ? "low" : etaMinutes <= 20 ? "moderate" : "heavy";

    return NextResponse.json({
      location: {
        lat: newPosition.lat,
        lng: newPosition.lng,
        heading: newPosition.heading,
        updatedAt: new Date().toISOString(),
      },
      eta: {
        minutes: etaMinutes,
        arrivalTime: arrival.toISOString(),
        distance: `${distMiles.toFixed(1)} miles`,
        trafficLevel,
      },
      formatted: {
        eta: formatETA(etaMinutes),
        distance: `${distMiles.toFixed(1)} miles away`,
      },
    });
  } catch (error) {
    console.error("Track simulation error:", error);
    return NextResponse.json(
      { error: "Failed to simulate location update" },
      { status: 500 }
    );
  }
}
