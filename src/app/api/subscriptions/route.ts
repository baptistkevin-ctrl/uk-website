import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/security/csrf";
import {
  FREQUENCY_OPTIONS,
  SUBSCRIPTION_DISCOUNT,
  type SubscriptionFrequency,
} from "@/stores/subscription-store";

export const dynamic = "force-dynamic";

const validFrequencies = FREQUENCY_OPTIONS.map((f) => f.value) as [
  string,
  ...string[],
];

const createSubscriptionSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  productName: z.string().min(1).max(200),
  productImage: z.string().url().nullable(),
  productPrice: z.number().int().positive(),
  frequency: z.enum(validFrequencies as [SubscriptionFrequency, ...SubscriptionFrequency[]]),
  quantity: z.number().int().min(1).max(99).default(1),
});

// GET /api/subscriptions — Get user's subscriptions
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 }
      );
    }

    try {
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (error) {
        // Table likely doesn't exist — fall back to client store
        return NextResponse.json({
          subscriptions: [],
          source: "client",
          message: "Using local storage for subscriptions",
        });
      }

      return NextResponse.json({
        subscriptions: subscriptions ?? [],
        source: "database",
      });
    } catch {
      return NextResponse.json({
        subscriptions: [],
        source: "client",
        message: "Using local storage for subscriptions",
      });
    }
  } catch (error) {
    console.error("[Subscriptions GET]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch subscriptions",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions — Create a subscription
export async function POST(request: NextRequest) {
  try {
    const csrf = await checkCsrf(request);
    if (!csrf.valid) return csrf.error!;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid subscription data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { productId, productName, productImage, productPrice, frequency, quantity } =
      parsed.data;

    const frequencyOption = FREQUENCY_OPTIONS.find(
      (f) => f.value === frequency
    );
    const days = frequencyOption?.days ?? 30;
    const nextDelivery = new Date();
    nextDelivery.setDate(nextDelivery.getDate() + days);

    const subscriptionRow = {
      user_id: user.id,
      product_id: productId,
      product_name: productName,
      product_image: productImage,
      product_price: productPrice,
      quantity,
      frequency,
      discount_percent: SUBSCRIPTION_DISCOUNT,
      next_delivery_date: nextDelivery.toISOString(),
      last_delivery_date: null,
      status: "active",
      total_deliveries: 0,
      total_saved: 0,
    };

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert(subscriptionRow)
        .select()
        .single();

      if (error) {
        // Table doesn't exist — client store handles persistence
        return NextResponse.json(
          {
            saved: false,
            source: "client",
            message: "Subscription saved locally",
          },
          { status: 201 }
        );
      }

      return NextResponse.json(
        { subscription: data, saved: true, source: "database" },
        { status: 201 }
      );
    } catch {
      return NextResponse.json(
        {
          saved: false,
          source: "client",
          message: "Subscription saved locally",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("[Subscriptions POST]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create subscription",
        },
      },
      { status: 500 }
    );
  }
}
