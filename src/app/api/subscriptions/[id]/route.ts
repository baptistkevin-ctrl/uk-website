import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

import {
  FREQUENCY_OPTIONS,
  type SubscriptionFrequency,
} from "@/stores/subscription-store";

export const dynamic = "force-dynamic";

const validFrequencies = FREQUENCY_OPTIONS.map((f) => f.value) as [
  string,
  ...string[],
];

const updateSubscriptionSchema = z.object({
  action: z.enum(["pause", "resume", "skip", "update_frequency", "update_quantity"]),
  frequency: z
    .enum(validFrequencies as [SubscriptionFrequency, ...SubscriptionFrequency[]])
    .optional(),
  quantity: z.number().int().min(1).max(99).optional(),
});

// PUT /api/subscriptions/[id] — Update a subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriptionId } = await params;

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
    const parsed = updateSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { action, frequency, quantity } = parsed.data;

    try {
      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !existing) {
        return NextResponse.json(
          {
            saved: false,
            source: "client",
            message: "Update applied locally",
          },
          { status: 200 }
        );
      }

      const updates: Record<string, unknown> = {};

      switch (action) {
        case "pause": {
          updates.status = "paused";
          break;
        }
        case "resume": {
          const days = FREQUENCY_OPTIONS.find(
            (f) => f.value === existing.frequency
          )?.days ?? 30;
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + days);

          updates.status = "active";
          updates.next_delivery_date = nextDate.toISOString();
          break;
        }
        case "skip": {
          const skipDays = FREQUENCY_OPTIONS.find(
            (f) => f.value === existing.frequency
          )?.days ?? 30;
          const skippedDate = new Date(existing.next_delivery_date);
          skippedDate.setDate(skippedDate.getDate() + skipDays);

          updates.next_delivery_date = skippedDate.toISOString();
          break;
        }
        case "update_frequency": {
          if (!frequency) {
            return NextResponse.json(
              {
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Frequency is required for update_frequency action",
                },
              },
              { status: 400 }
            );
          }

          const freqDays = FREQUENCY_OPTIONS.find(
            (f) => f.value === frequency
          )?.days ?? 30;
          const freqDate = new Date();
          freqDate.setDate(freqDate.getDate() + freqDays);

          updates.frequency = frequency;
          updates.next_delivery_date = freqDate.toISOString();
          break;
        }
        case "update_quantity": {
          if (!quantity) {
            return NextResponse.json(
              {
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Quantity is required for update_quantity action",
                },
              },
              { status: 400 }
            );
          }

          updates.quantity = quantity;
          break;
        }
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", subscriptionId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({
          saved: false,
          source: "client",
          message: "Update applied locally",
        });
      }

      return NextResponse.json({
        subscription: data,
        saved: true,
        source: "database",
      });
    } catch {
      return NextResponse.json({
        saved: false,
        source: "client",
        message: "Update applied locally",
      });
    }
  } catch (error) {
    console.error("[Subscriptions PUT]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update subscription",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id] — Cancel a subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriptionId } = await params;

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
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", subscriptionId)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({
          saved: false,
          source: "client",
          message: "Cancellation applied locally",
        });
      }

      return NextResponse.json({
        cancelled: true,
        saved: true,
        source: "database",
      });
    } catch {
      return NextResponse.json({
        saved: false,
        source: "client",
        message: "Cancellation applied locally",
      });
    }
  } catch (error) {
    console.error("[Subscriptions DELETE]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to cancel subscription",
        },
      },
      { status: 500 }
    );
  }
}
