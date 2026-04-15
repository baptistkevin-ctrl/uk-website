import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AddAllRequestItem {
  productId: string;
  quantity: number;
}

interface ValidatedItem {
  productId: string;
  name: string;
  slug: string;
  quantity: number;
  price_pence: number;
  image_url: string | null;
  unit: string | null;
  brand: string | null;
  is_organic: boolean;
  availableStock: number | null;
}

function isValidRequest(
  body: unknown
): body is { items: AddAllRequestItem[] } {
  if (!body || typeof body !== "object") return false;

  const obj = body as Record<string, unknown>;
  if (!Array.isArray(obj.items)) return false;
  if (obj.items.length === 0 || obj.items.length > 50) return false;

  return obj.items.every((item: unknown) => {
    if (typeof item !== "object" || item === null) return false;
    const rec = item as Record<string, unknown>;
    if (typeof rec.productId !== "string") return false;
    if (typeof rec.quantity !== "number") return false;
    const qty = rec.quantity as number;
    return qty > 0 && qty <= 99 && Number.isInteger(qty);
  });
}

export async function POST(request: NextRequest) {
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

    const body: unknown = await request.json().catch(() => null);

    if (!isValidRequest(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Provide { items: [{ productId: string, quantity: number }] } with 1-50 items",
        },
        { status: 400 }
      );
    }

    const productIds = body.items.map((item) => item.productId);
    const quantityMap = new Map(
      body.items.map((item) => [item.productId, item.quantity])
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id, name, slug, price_pence, image_url, unit, brand, is_organic, stock_quantity, is_active"
      )
      .in("id", productIds);

    if (productsError) {
      return NextResponse.json(
        { error: "Failed to validate products" },
        { status: 500 }
      );
    }

    const validatedItems: ValidatedItem[] = [];
    const unavailableItems: { productId: string; reason: string }[] = [];

    for (const id of productIds) {
      const product = products?.find((p) => p.id === id);
      const requestedQty = quantityMap.get(id) ?? 1;

      if (!product) {
        unavailableItems.push({ productId: id, reason: "Product not found" });
        continue;
      }

      if (!product.is_active) {
        unavailableItems.push({
          productId: id,
          reason: "Product no longer available",
        });
        continue;
      }

      if (
        product.stock_quantity !== null &&
        product.stock_quantity < requestedQty
      ) {
        if (product.stock_quantity === 0) {
          unavailableItems.push({
            productId: id,
            reason: "Out of stock",
          });
          continue;
        }

        validatedItems.push({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          quantity: product.stock_quantity,
          price_pence: product.price_pence,
          image_url: product.image_url,
          unit: product.unit,
          brand: product.brand,
          is_organic: product.is_organic,
          availableStock: product.stock_quantity,
        });
        continue;
      }

      validatedItems.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        quantity: requestedQty,
        price_pence: product.price_pence,
        image_url: product.image_url,
        unit: product.unit,
        brand: product.brand,
        is_organic: product.is_organic,
        availableStock: product.stock_quantity,
      });
    }

    const totalPence = validatedItems.reduce(
      (sum, item) => sum + item.price_pence * item.quantity,
      0
    );

    const response = NextResponse.json({
      success: true,
      addedCount: validatedItems.length,
      items: validatedItems,
      unavailableItems:
        unavailableItems.length > 0 ? unavailableItems : undefined,
      estimatedTotal: totalPence,
    });

    response.headers.set("X-RateLimit-Limit", "60");
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
