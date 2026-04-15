import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  price_pence: number;
  image_url: string | null;
  unit: string | null;
  brand: string | null;
  is_organic: boolean;
  stock_quantity: number | null;
  is_active: boolean;
}

interface SmartReorderItem {
  product: Omit<ProductInfo, "is_active">;
  suggestedQuantity: number;
  purchaseCount: number;
  avgDaysBetween: number;
  lastPurchased: string;
  confidence: number;
  reason: string;
}

interface OrderItemRow {
  product_id: string;
  name: string;
  quantity: number;
  orders: {
    created_at: string;
  };
}

interface ProductPurchaseData {
  productId: string;
  purchaseDates: Date[];
  quantities: number[];
  totalPurchases: number;
}

const MIN_CONFIDENCE = 0.3;
const MAX_SUGGESTIONS = 25;
const MAX_ORDERS_TO_ANALYZE = 20;

function calculateDaysBetween(dateA: Date, dateB: Date): number {
  const ms = Math.abs(dateA.getTime() - dateB.getTime());
  return ms / (1000 * 60 * 60 * 24);
}

function computeAvgDaysBetween(dates: Date[]): number {
  if (dates.length < 2) return 30;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  let totalGap = 0;

  for (let i = 1; i < sorted.length; i++) {
    totalGap += calculateDaysBetween(sorted[i], sorted[i - 1]);
  }

  return Math.round(totalGap / (sorted.length - 1));
}

function computeConsistency(dates: Date[]): number {
  if (dates.length < 3) return 0.5;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    gaps.push(calculateDaysBetween(sorted[i], sorted[i - 1]));
  }

  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  if (avgGap === 0) return 1;

  const variance =
    gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avgGap;

  return Math.max(0, Math.min(1, 1 - cv));
}

function computeRecencyScore(
  lastPurchaseDate: Date,
  avgDaysBetween: number
): number {
  const daysSinceLast = calculateDaysBetween(new Date(), lastPurchaseDate);
  const ratio = daysSinceLast / avgDaysBetween;

  if (ratio >= 0.8 && ratio <= 1.5) return 1.0;
  if (ratio < 0.8) return 0.6;
  if (ratio <= 2.0) return 0.8;
  if (ratio <= 3.0) return 0.5;
  return 0.3;
}

function computeFrequencyScore(purchaseCount: number): number {
  if (purchaseCount >= 8) return 1.0;
  if (purchaseCount >= 5) return 0.85;
  if (purchaseCount >= 3) return 0.65;
  if (purchaseCount >= 2) return 0.45;
  return 0.3;
}

function computeConfidence(
  frequency: number,
  recency: number,
  consistency: number
): number {
  const raw = frequency * 0.4 + recency * 0.35 + consistency * 0.25;
  return Math.round(raw * 100) / 100;
}

function generateReason(
  purchaseCount: number,
  avgDays: number,
  daysSinceLast: number,
  confidence: number
): string {
  const isOverdue = daysSinceLast > avgDays * 0.8;

  if (purchaseCount >= 8 && avgDays <= 7) {
    return `Weekly staple — bought ${purchaseCount} times`;
  }

  if (purchaseCount >= 5 && avgDays <= 14) {
    return isOverdue
      ? `Usually every ${avgDays} days — due for reorder`
      : `Regular buy — every ${avgDays} days`;
  }

  if (purchaseCount >= 3 && avgDays <= 35) {
    return `Monthly essential — bought ${purchaseCount} times`;
  }

  if (confidence >= 0.5) {
    return `Bought in your last ${Math.min(purchaseCount, 3)} orders`;
  }

  return `Bought ${purchaseCount} time${purchaseCount > 1 ? "s" : ""} before`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("status", "delivered")
      .order("created_at", { ascending: false })
      .limit(MAX_ORDERS_TO_ANALYZE);

    if (ordersError) {
      return NextResponse.json(
        { error: "Failed to fetch order history" },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        suggestions: [],
        lastOrderDate: null,
        confidence: 0,
        message: "No completed orders found to generate suggestions",
      });
    }

    const orderIds = orders.map((o) => o.id);
    const lastOrderDate = orders[0].created_at;

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, name, quantity, orders!inner(created_at)")
      .in("order_id", orderIds);

    if (itemsError) {
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({
        suggestions: [],
        lastOrderDate,
        confidence: 0,
        message: "No items found in order history",
      });
    }

    const productMap = new Map<string, ProductPurchaseData>();

    for (const item of orderItems as unknown as OrderItemRow[]) {
      const existing = productMap.get(item.product_id);
      const purchaseDate = new Date(item.orders.created_at);

      if (existing) {
        existing.purchaseDates.push(purchaseDate);
        existing.quantities.push(item.quantity);
        existing.totalPurchases += 1;
      } else {
        productMap.set(item.product_id, {
          productId: item.product_id,
          purchaseDates: [purchaseDate],
          quantities: [item.quantity],
          totalPurchases: 1,
        });
      }
    }

    const productIds = Array.from(productMap.keys());

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id, name, slug, price_pence, image_url, unit, brand, is_organic, stock_quantity, is_active"
      )
      .in("id", productIds);

    if (productsError) {
      return NextResponse.json(
        { error: "Failed to fetch product details" },
        { status: 500 }
      );
    }

    const activeProducts = new Map<string, ProductInfo>();
    for (const p of products ?? []) {
      if (p.is_active && (p.stock_quantity === null || p.stock_quantity > 0)) {
        activeProducts.set(p.id, p as ProductInfo);
      }
    }

    const suggestions: SmartReorderItem[] = [];

    for (const [productId, data] of Array.from(productMap.entries())) {
      const product = activeProducts.get(productId);
      if (!product) continue;

      const avgDays = computeAvgDaysBetween(data.purchaseDates);
      const consistency = computeConsistency(data.purchaseDates);

      const sortedDates = [...data.purchaseDates].sort(
        (a, b) => b.getTime() - a.getTime()
      );
      const lastPurchaseDate = sortedDates[0];
      const daysSinceLast = calculateDaysBetween(new Date(), lastPurchaseDate);

      const frequencyScore = computeFrequencyScore(data.totalPurchases);
      const recencyScore = computeRecencyScore(lastPurchaseDate, avgDays);
      const confidence = computeConfidence(
        frequencyScore,
        recencyScore,
        consistency
      );

      if (confidence < MIN_CONFIDENCE) continue;

      const avgQuantity =
        data.quantities.reduce((sum, q) => sum + q, 0) / data.quantities.length;
      const suggestedQuantity = Math.max(1, Math.round(avgQuantity));

      const reason = generateReason(
        data.totalPurchases,
        avgDays,
        daysSinceLast,
        confidence
      );

      const { is_active: _isActive, ...productWithoutActive } = product;

      suggestions.push({
        product: productWithoutActive,
        suggestedQuantity,
        purchaseCount: data.totalPurchases,
        avgDaysBetween: avgDays,
        lastPurchased: lastPurchaseDate.toISOString(),
        confidence,
        reason,
      });
    }

    suggestions.sort((a, b) => b.confidence - a.confidence);
    const topSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);

    const overallConfidence =
      topSuggestions.length > 0
        ? Math.round(
            (topSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
              topSuggestions.length) *
              100
          ) / 100
        : 0;

    const response = NextResponse.json({
      suggestions: topSuggestions,
      lastOrderDate,
      confidence: overallConfidence,
    });

    response.headers.set("X-RateLimit-Limit", "30");
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate"
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
