/**
 * AI Smart Substitutions Engine
 *
 * Scores candidate products as substitutions for an unavailable item.
 * Factors: category match, price similarity, brand affinity,
 * dietary compatibility, and quality signals.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubstitutionProduct {
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
  category_id?: string | null;
  parent_category_id?: string | null;
}

export interface SubstitutionCandidate {
  product: {
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
  };
  score: number;
  reasons: string[];
  priceChange: number;
  priceChangePercent: number;
  matchType:
    | "exact_category"
    | "same_brand"
    | "similar_product"
    | "dietary_match";
}

export interface SubstitutionPreferences {
  priority: "same_brand" | "cheapest" | "closest_match" | "organic_preferred";
  maxPriceIncrease: number;
  dietaryStrict: boolean;
  preferOrganic: boolean;
  acceptAutoSubstitute: boolean;
}

export interface PurchaseHistoryEntry {
  productId: string;
  brand: string | null;
  count: number;
}

export interface DietaryProfile {
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
}

export const DEFAULT_PREFERENCES: SubstitutionPreferences = {
  priority: "closest_match",
  maxPriceIncrease: 20,
  dietaryStrict: true,
  preferOrganic: false,
  acceptAutoSubstitute: false,
};

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

const MAX_RESULTS = 5;

function scoreCategoryMatch(
  original: SubstitutionProduct,
  candidate: SubstitutionProduct
): { points: number; reason: string | null } {
  if (
    original.category_id &&
    candidate.category_id &&
    original.category_id === candidate.category_id
  ) {
    return { points: 30, reason: "Same category" };
  }

  if (
    original.parent_category_id &&
    candidate.parent_category_id &&
    original.parent_category_id === candidate.parent_category_id
  ) {
    return { points: 20, reason: "Same parent category" };
  }

  if (original.parent_category_id && candidate.category_id) {
    if (original.parent_category_id === candidate.category_id) {
      return { points: 10, reason: "Related category" };
    }
  }

  return { points: 0, reason: null };
}

function scorePriceSimilarity(
  original: SubstitutionProduct,
  candidate: SubstitutionProduct,
  maxPriceIncrease: number
): { points: number; reason: string | null } {
  if (original.price_pence === 0) return { points: 15, reason: null };

  const diff = candidate.price_pence - original.price_pence;
  const pct = Math.abs(diff / original.price_pence) * 100;
  const isExpensive = diff > 0;

  if (isExpensive && pct > maxPriceIncrease) {
    return { points: -50, reason: `${Math.round(pct)}% more expensive — exceeds limit` };
  }

  let points = 0;
  if (pct <= 5) points = 25;
  else if (pct <= 10) points = 20;
  else if (pct <= 20) points = 15;
  else if (pct <= 30) points = 10;
  else points = 5;

  if (diff < 0) {
    points += 5;
  }

  const reason =
    diff === 0
      ? "Same price"
      : diff < 0
        ? `${Math.round(Math.abs(pct))}% cheaper`
        : `${Math.round(pct)}% more expensive`;

  return { points, reason };
}

function scoreBrandAffinity(
  original: SubstitutionProduct,
  candidate: SubstitutionProduct,
  purchaseHistory?: PurchaseHistoryEntry[]
): { points: number; reason: string | null } {
  if (
    original.brand &&
    candidate.brand &&
    original.brand.toLowerCase() === candidate.brand.toLowerCase()
  ) {
    return { points: 20, reason: "Same brand" };
  }

  if (purchaseHistory && candidate.brand) {
    const brandLower = candidate.brand.toLowerCase();
    const purchased = purchaseHistory.find(
      (h) => h.brand && h.brand.toLowerCase() === brandLower
    );

    if (purchased && purchased.count >= 2) {
      return { points: 15, reason: "Brand you buy often" };
    }

    if (purchased) {
      return { points: 12, reason: "Brand you've bought before" };
    }
  }

  if (candidate.brand) {
    return { points: 5, reason: null };
  }

  return { points: 3, reason: null };
}

function scoreDietaryCompatibility(
  original: SubstitutionProduct,
  candidate: SubstitutionProduct,
  dietaryStrict: boolean,
  dietaryProfile?: DietaryProfile
): { points: number; reason: string | null } {
  const requiresVegan =
    original.is_vegan || dietaryProfile?.isVegan;
  const requiresVegetarian =
    original.is_vegetarian || dietaryProfile?.isVegetarian;
  const requiresGlutenFree =
    original.is_gluten_free || dietaryProfile?.isGlutenFree;

  if (dietaryStrict) {
    if (requiresVegan && !candidate.is_vegan) {
      return { points: -100, reason: "Not vegan — excluded" };
    }
    if (requiresVegetarian && !candidate.is_vegetarian) {
      return { points: -100, reason: "Not vegetarian — excluded" };
    }
    if (requiresGlutenFree && !candidate.is_gluten_free) {
      return { points: -100, reason: "Not gluten free — excluded" };
    }
  }

  let points = 0;
  const reasons: string[] = [];

  if (requiresVegan && candidate.is_vegan) {
    points += 5;
    reasons.push("Vegan");
  }
  if (requiresVegetarian && candidate.is_vegetarian) {
    points += 5;
    reasons.push("Vegetarian");
  }
  if (requiresGlutenFree && candidate.is_gluten_free) {
    points += 5;
    reasons.push("Gluten free");
  }

  points = Math.min(points, 15);

  return {
    points,
    reason: reasons.length > 0 ? `Dietary match: ${reasons.join(", ")}` : null,
  };
}

function scoreQualitySignals(
  original: SubstitutionProduct,
  candidate: SubstitutionProduct,
  preferOrganic: boolean
): { points: number; reason: string | null } {
  let points = 0;
  let reason: string | null = null;

  if (original.is_organic && candidate.is_organic) {
    points += 5;
    reason = "Also organic";
  } else if (preferOrganic && candidate.is_organic) {
    points += 5;
    reason = "Organic option";
  }

  if (
    original.unit &&
    candidate.unit &&
    original.unit.toLowerCase() === candidate.unit.toLowerCase()
  ) {
    points += 3;
  }

  if (
    candidate.stock_quantity === null ||
    candidate.stock_quantity >= 10
  ) {
    points += 2;
  }

  return { points: Math.min(points, 10), reason };
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

function scoreSubstitution(
  original: SubstitutionProduct,
  candidate: SubstitutionProduct,
  preferences: SubstitutionPreferences,
  purchaseHistory?: PurchaseHistoryEntry[],
  dietaryProfile?: DietaryProfile
): SubstitutionCandidate | null {
  if (candidate.id === original.id) return null;

  if (
    candidate.stock_quantity !== null &&
    candidate.stock_quantity <= 0
  ) {
    return null;
  }

  const reasons: string[] = [];
  let totalScore = 0;

  const category = scoreCategoryMatch(original, candidate);
  totalScore += category.points;
  if (category.reason) reasons.push(category.reason);

  const price = scorePriceSimilarity(
    original,
    candidate,
    preferences.maxPriceIncrease
  );
  totalScore += price.points;
  if (price.reason) reasons.push(price.reason);

  const brand = scoreBrandAffinity(original, candidate, purchaseHistory);
  totalScore += brand.points;
  if (brand.reason) reasons.push(brand.reason);

  const dietary = scoreDietaryCompatibility(
    original,
    candidate,
    preferences.dietaryStrict,
    dietaryProfile
  );
  totalScore += dietary.points;
  if (dietary.reason) reasons.push(dietary.reason);

  const quality = scoreQualitySignals(
    original,
    candidate,
    preferences.preferOrganic
  );
  totalScore += quality.points;
  if (quality.reason) reasons.push(quality.reason);

  if (totalScore <= 0) return null;

  const clampedScore = Math.max(0, Math.min(100, totalScore));

  if (preferences.priority === "same_brand" && brand.points >= 20) {
    totalScore += 10;
  }
  if (preferences.priority === "cheapest" && price.points >= 25) {
    totalScore += 10;
  }
  if (preferences.priority === "organic_preferred" && candidate.is_organic) {
    totalScore += 10;
  }

  const priceDiff = candidate.price_pence - original.price_pence;
  const pricePct =
    original.price_pence > 0
      ? (priceDiff / original.price_pence) * 100
      : 0;

  const matchType = determineMatchType(category.points, brand.points, dietary.points);

  return {
    product: {
      id: candidate.id,
      name: candidate.name,
      slug: candidate.slug,
      price_pence: candidate.price_pence,
      image_url: candidate.image_url,
      brand: candidate.brand,
      unit: candidate.unit,
      is_organic: candidate.is_organic,
      is_vegan: candidate.is_vegan,
      is_vegetarian: candidate.is_vegetarian,
      is_gluten_free: candidate.is_gluten_free,
      stock_quantity: candidate.stock_quantity,
    },
    score: Math.max(0, Math.min(100, clampedScore)),
    reasons,
    priceChange: priceDiff,
    priceChangePercent: Math.round(pricePct * 10) / 10,
    matchType,
  };
}

function determineMatchType(
  categoryPoints: number,
  brandPoints: number,
  dietaryPoints: number
): SubstitutionCandidate["matchType"] {
  if (categoryPoints >= 30) return "exact_category";
  if (brandPoints >= 20) return "same_brand";
  if (dietaryPoints >= 10) return "dietary_match";
  return "similar_product";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function findBestSubstitutions(
  originalProduct: SubstitutionProduct,
  candidates: SubstitutionProduct[],
  preferences: SubstitutionPreferences,
  purchaseHistory?: PurchaseHistoryEntry[],
  dietaryProfile?: DietaryProfile
): SubstitutionCandidate[] {
  const scored: SubstitutionCandidate[] = [];

  for (const candidate of candidates) {
    const result = scoreSubstitution(
      originalProduct,
      candidate,
      preferences,
      purchaseHistory,
      dietaryProfile
    );

    if (result) {
      scored.push(result);
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.priceChange - b.priceChange;
  });

  return scored.slice(0, MAX_RESULTS);
}
