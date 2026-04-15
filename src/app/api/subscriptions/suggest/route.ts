import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  FREQUENCY_OPTIONS,
  SUBSCRIPTION_DISCOUNT,
  type SubscriptionFrequency,
} from "@/stores/subscription-store";

export const dynamic = "force-dynamic";

const FRESH_KEYWORDS = [
  "milk",
  "bread",
  "eggs",
  "lettuce",
  "spinach",
  "tomato",
  "banana",
  "apple",
  "orange",
  "berries",
  "yoghurt",
  "yogurt",
  "cream",
  "salad",
  "herb",
  "fresh",
  "juice",
];

const BIWEEKLY_KEYWORDS = [
  "meat",
  "chicken",
  "beef",
  "pork",
  "lamb",
  "fish",
  "salmon",
  "cheese",
  "crisps",
  "chips",
  "snack",
  "biscuit",
  "cereal",
  "frozen",
];

function getHeuristicFrequency(productName: string): {
  frequency: SubscriptionFrequency;
  reason: string;
} {
  const lower = productName.toLowerCase();

  if (FRESH_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      frequency: "weekly",
      reason: "Fresh items are typically purchased weekly",
    };
  }

  if (BIWEEKLY_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      frequency: "every_2_weeks",
      reason: "This product category is commonly restocked fortnightly",
    };
  }

  return {
    frequency: "monthly",
    reason: "Monthly delivery works well for pantry staples",
  };
}

function estimateAnnualSaving(pricePence: number, frequency: SubscriptionFrequency): number {
  const days = FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.days ?? 30;
  const deliveriesPerYear = 365 / days;
  const savingPerDelivery = Math.round(pricePence * (SUBSCRIPTION_DISCOUNT / 100));

  return Math.round(savingPerDelivery * deliveriesPerYear);
}

// GET /api/subscriptions/suggest?productId=XXX
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "productId query parameter is required",
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch product info for heuristics
    let productName = "";
    let productPrice = 0;

    try {
      const { data: product } = await supabase
        .from("products")
        .select("name, price_pence")
        .eq("id", productId)
        .single();

      if (product) {
        productName = product.name;
        productPrice = product.price_pence;
      }
    } catch {
      // Product lookup failed — we can still return heuristic defaults
    }

    // Try purchase-history-based suggestion for authenticated users
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && productName) {
      try {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("quantity, orders!inner(created_at)")
          .eq("product_id", productId)
          .eq("orders.user_id", user.id)
          .order("orders(created_at)", { ascending: false })
          .limit(10);

        if (orderItems && orderItems.length >= 3) {
          const dates = orderItems
            .map((item) => {
              const order = item.orders as unknown as { created_at: string };
              return new Date(order.created_at);
            })
            .sort((a, b) => b.getTime() - a.getTime());

          const gaps: number[] = [];
          for (let i = 0; i < dates.length - 1; i++) {
            const diffMs = dates[i].getTime() - dates[i + 1].getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            gaps.push(diffDays);
          }

          const avgGap = Math.round(
            gaps.reduce((sum, g) => sum + g, 0) / gaps.length
          );

          // Match to closest frequency
          const closest = FREQUENCY_OPTIONS.reduce((best, opt) =>
            Math.abs(opt.days - avgGap) < Math.abs(best.days - avgGap)
              ? opt
              : best
          );

          return NextResponse.json({
            suggestedFrequency: closest.value,
            reason: `Based on your purchase history (avg. every ${avgGap} days)`,
            discount: SUBSCRIPTION_DISCOUNT,
            estimatedAnnualSaving: estimateAnnualSaving(
              productPrice,
              closest.value
            ),
            source: "purchase_history",
          });
        }
      } catch {
        // Purchase history query failed — fall through to heuristics
      }
    }

    // Fallback to heuristic suggestion
    const { frequency, reason } = getHeuristicFrequency(
      productName || "general item"
    );

    return NextResponse.json({
      suggestedFrequency: frequency,
      reason,
      discount: SUBSCRIPTION_DISCOUNT,
      estimatedAnnualSaving: estimateAnnualSaving(productPrice, frequency),
      source: productName ? "heuristic" : "default",
    });
  } catch (error) {
    console.error("[Subscriptions Suggest]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate suggestion",
        },
      },
      { status: 500 }
    );
  }
}
