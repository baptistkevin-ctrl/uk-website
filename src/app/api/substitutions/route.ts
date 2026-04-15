import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findBestSubstitutions,
  DEFAULT_PREFERENCES,
  type SubstitutionProduct,
  type SubstitutionPreferences,
  type PurchaseHistoryEntry,
  type DietaryProfile,
} from "@/lib/substitutions/substitution-engine";

const MAX_CANDIDATES = 50;
const MAX_ORDERS_FOR_HISTORY = 30;

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price_pence: number;
  image_url: string | null;
  brand: string | null;
  unit: string | null;
  is_organic: boolean;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  stock_quantity: number | null;
  category_id: string | null;
  categories: { parent_id: string | null } | null;
}

interface OrderItemRow {
  product_id: string;
  products: { brand: string | null } | null;
}

function toSubstitutionProduct(
  row: ProductRow
): SubstitutionProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price_pence: row.price_pence,
    image_url: row.image_url,
    brand: row.brand,
    unit: row.unit,
    is_organic: row.is_organic,
    is_vegan: row.is_vegan,
    is_vegetarian: row.is_vegetarian,
    is_gluten_free: row.is_gluten_free,
    stock_quantity: row.stock_quantity,
    category_id: row.category_id,
    parent_category_id: row.categories?.parent_id ?? null,
  };
}

async function fetchUserPreferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<SubstitutionPreferences> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("substitution_preferences")
      .eq("id", userId)
      .single();

    if (data?.substitution_preferences) {
      return {
        ...DEFAULT_PREFERENCES,
        ...(data.substitution_preferences as Partial<SubstitutionPreferences>),
      };
    }
  } catch {
    // Fall through to defaults
  }

  return DEFAULT_PREFERENCES;
}

async function fetchPurchaseHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<PurchaseHistoryEntry[]> {
  try {
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MAX_ORDERS_FOR_HISTORY);

    if (!orders || orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);

    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, products(brand)")
      .in("order_id", orderIds);

    if (!items) return [];

    const counts = new Map<
      string,
      { brand: string | null; count: number }
    >();

    for (const item of items as unknown as OrderItemRow[]) {
      const existing = counts.get(item.product_id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(item.product_id, {
          brand: item.products?.brand ?? null,
          count: 1,
        });
      }
    }

    return Array.from(counts.entries()).map(([productId, data]) => ({
      productId,
      brand: data.brand,
      count: data.count,
    }));
  } catch {
    return [];
  }
}

async function fetchDietaryProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<DietaryProfile | undefined> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("dietary_preferences")
      .eq("id", userId)
      .single();

    const prefs = data?.dietary_preferences as
      | Record<string, unknown>
      | null
      | undefined;

    if (!prefs) return undefined;

    return {
      isVegan: prefs.dietType === "vegan",
      isVegetarian:
        prefs.dietType === "vegetarian" || prefs.dietType === "vegan",
      isGlutenFree: Array.isArray(prefs.intolerances)
        ? prefs.intolerances.some(
            (i: unknown) =>
              typeof i === "string" &&
              i.toLowerCase().includes("gluten")
          )
        : false,
    };
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "productId query parameter is required",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the original product
    const { data: originalRow, error: productError } = await supabase
      .from("products")
      .select("id, name, slug, price_pence, image_url, brand, unit, is_organic, is_vegan, is_vegetarian, is_gluten_free, stock_quantity")
      .eq("id", productId)
      .single();

    if (productError || !originalRow) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Product not found" },
        { status: 404 }
      );
    }

    // Get category via product_categories join table
    const { data: productCats } = await supabase
      .from("product_categories")
      .select("category_id, categories(id, parent_id)")
      .eq("product_id", productId);

    const categoryId = productCats?.[0]?.category_id ?? null;
    const parentCategoryId = (productCats?.[0] as any)?.categories?.parent_id ?? null;

    const original = {
      id: originalRow.id,
      name: originalRow.name,
      slug: originalRow.slug,
      price_pence: originalRow.price_pence,
      image_url: originalRow.image_url,
      brand: originalRow.brand,
      unit: originalRow.unit,
      is_organic: originalRow.is_organic ?? false,
      is_vegan: originalRow.is_vegan ?? false,
      is_vegetarian: originalRow.is_vegetarian ?? false,
      is_gluten_free: originalRow.is_gluten_free ?? false,
      stock_quantity: originalRow.stock_quantity,
      category_id: categoryId,
      parent_category_id: parentCategoryId,
    };

    // Determine which categories to search for candidates
    const categoryIds: string[] = [];
    if (original.category_id) categoryIds.push(original.category_id);
    if (original.parent_category_id)
      categoryIds.push(original.parent_category_id);

    // Fetch sibling categories under the same parent
    if (original.parent_category_id) {
      const { data: siblings } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", original.parent_category_id);

      if (siblings) {
        for (const s of siblings) {
          if (!categoryIds.includes(s.id)) {
            categoryIds.push(s.id);
          }
        }
      }
    }

    // Fetch candidate product IDs from matching categories via product_categories
    let candidateProductIds: string[] = [];
    if (categoryIds.length > 0) {
      const { data: catProducts } = await supabase
        .from("product_categories")
        .select("product_id")
        .in("category_id", categoryIds);
      candidateProductIds = (catProducts ?? []).map((cp) => cp.product_id).filter((id) => id !== productId);
    }

    // Fetch candidate products
    let candidateRows: any[] = [];
    if (candidateProductIds.length > 0) {
      const { data, error: candidateError } = await supabase
        .from("products")
        .select("id, name, slug, price_pence, image_url, brand, unit, is_organic, is_vegan, is_vegetarian, is_gluten_free, stock_quantity")
        .in("id", candidateProductIds.slice(0, MAX_CANDIDATES))
        .eq("is_active", true)
        .gt("stock_quantity", 0);

      if (candidateError) {
        return NextResponse.json(
          { code: "INTERNAL_ERROR", message: "Failed to fetch candidate products" },
          { status: 500 }
        );
      }
      candidateRows = data ?? [];
    }

    // Map candidates to substitution products
    const candidates = candidateRows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      price_pence: row.price_pence,
      image_url: row.image_url,
      brand: row.brand,
      unit: row.unit,
      is_organic: row.is_organic ?? false,
      is_vegan: row.is_vegan ?? false,
      is_vegetarian: row.is_vegetarian ?? false,
      is_gluten_free: row.is_gluten_free ?? false,
      stock_quantity: row.stock_quantity,
      category_id: categoryId,
      parent_category_id: parentCategoryId,
    }));

    // Fetch user context in parallel (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let preferences = DEFAULT_PREFERENCES;
    let purchaseHistory: PurchaseHistoryEntry[] | undefined;
    let dietaryProfile: DietaryProfile | undefined;

    if (user) {
      const [prefs, history, dietary] = await Promise.all([
        fetchUserPreferences(supabase, user.id),
        fetchPurchaseHistory(supabase, user.id),
        fetchDietaryProfile(supabase, user.id),
      ]);

      preferences = prefs;
      purchaseHistory = history;
      dietaryProfile = dietary;
    }

    // Run scoring engine
    const substitutions = findBestSubstitutions(
      original,
      candidates,
      preferences,
      purchaseHistory,
      dietaryProfile
    );

    const message =
      substitutions.length > 0
        ? `We found ${substitutions.length} alternative${substitutions.length > 1 ? "s" : ""} based on ${user ? "your shopping history" : "product similarity"}`
        : "No suitable substitutions found";

    const response = NextResponse.json({
      original: {
        id: original.id,
        name: original.name,
        price_pence: original.price_pence,
        image_url: original.image_url,
        brand: original.brand,
        stock_quantity: original.stock_quantity,
      },
      substitutions,
      preferences,
      reason: message,
    });

    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate"
    );

    return response;
  } catch {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to compute substitutions" },
      { status: 500 }
    );
  }
}
