// CO2 equivalent in kg per kg of food product
// Sources: Our World in Data, DEFRA 2024 emission factors
export const CARBON_PER_KG: Record<string, number> = {
  // Meat & Fish (highest impact)
  "beef": 27.0,
  "lamb": 24.0,
  "cheese": 13.5,
  "pork": 7.6,
  "chicken": 6.9,
  "turkey": 5.7,
  "prawns": 12.0,
  "salmon": 6.0,
  "cod": 5.4,
  "tuna": 6.1,
  "haddock": 5.0,
  "sea bass": 5.8,

  // Dairy
  "milk": 3.2,
  "cream": 3.7,
  "butter": 9.0,
  "yogurt": 2.5,
  "eggs": 4.8,
  "mozzarella": 10.0,
  "cheddar": 13.5,
  "parmesan": 13.5,
  "feta": 10.0,
  "brie": 12.0,

  // Grains & Bakery
  "bread": 1.3,
  "pasta": 1.6,
  "rice": 4.0,
  "oats": 1.6,
  "flour": 1.1,
  "croissant": 2.5,
  "bagel": 1.4,

  // Fruits (low impact)
  "banana": 0.9,
  "apple": 0.4,
  "strawberry": 1.5,
  "blueberry": 1.7,
  "grape": 1.4,
  "avocado": 2.5,
  "mango": 1.9,
  "pineapple": 1.6,
  "lemon": 0.5,
  "orange": 0.5,

  // Vegetables (lowest impact)
  "carrot": 0.4,
  "tomato": 1.4,
  "spinach": 0.5,
  "broccoli": 0.9,
  "pepper": 1.0,
  "cucumber": 0.7,
  "onion": 0.3,
  "garlic": 0.5,
  "mushroom": 0.8,
  "lettuce": 0.7,
  "corn": 1.1,
  "potato": 0.5,
  "peas": 0.8,

  // Pantry
  "olive oil": 3.5,
  "coconut milk": 1.3,
  "baked beans": 1.2,
  "chickpeas": 0.8,
  "kidney beans": 0.8,
  "tomato sauce": 1.5,
  "soy sauce": 1.0,
  "ketchup": 1.5,
  "peanut butter": 2.5,
  "honey": 1.2,
  "chocolate": 4.6,

  // Drinks
  "juice": 0.8,
  "coffee": 8.0,
  "tea": 2.0,
  "water": 0.1,

  // Frozen
  "ice cream": 3.8,
  "frozen pizza": 3.5,
  "fish fingers": 5.0,
  "chips": 1.2,

  // Snacks
  "crisps": 2.8,
  "biscuits": 2.0,
  "nuts": 1.2,
};

// Category-level fallbacks (when no specific match)
export const CARBON_CATEGORY_DEFAULTS: Record<string, number> = {
  "fresh-produce": 0.8,
  "fruits": 1.0,
  "vegetables": 0.6,
  "meat-fish": 10.0,
  "chicken-poultry": 6.5,
  "beef-lamb": 25.0,
  "pork": 7.5,
  "fish-seafood": 6.0,
  "dairy-eggs": 5.0,
  "milk-cream": 3.2,
  "cheese": 13.0,
  "eggs": 4.8,
  "butter-yogurt": 5.0,
  "bakery": 1.8,
  "bread": 1.3,
  "pastries": 2.5,
  "pantry": 1.5,
  "rice-pasta": 2.0,
  "tinned-canned": 1.0,
  "sauces-condiments": 1.5,
  "drinks": 1.0,
  "tea-coffee": 5.0,
  "juices": 0.8,
  "water-soft-drinks": 0.3,
  "frozen": 2.5,
  "frozen-meals": 3.5,
  "ice-cream": 3.8,
  "snacks-treats": 2.5,
  "chocolate": 4.6,
  "crisps-nuts": 2.0,
  "biscuits": 2.0,
};

// Packaging carbon impact (kg CO2 per item)
export const PACKAGING_IMPACT: Record<string, { co2: number; recyclable: boolean; label: string }> = {
  "plastic": { co2: 0.04, recyclable: true, label: "Plastic packaging" },
  "glass": { co2: 0.06, recyclable: true, label: "Glass container" },
  "tin": { co2: 0.05, recyclable: true, label: "Metal tin" },
  "cardboard": { co2: 0.02, recyclable: true, label: "Cardboard box" },
  "paper": { co2: 0.01, recyclable: true, label: "Paper bag" },
  "none": { co2: 0, recyclable: true, label: "No packaging" },
};

// Delivery method carbon impact
export const DELIVERY_CARBON: Record<string, { co2PerMile: number; label: string; icon: string }> = {
  "electric_van": { co2PerMile: 0.05, label: "Electric Van", icon: "Zap" },
  "diesel_van": { co2PerMile: 0.27, label: "Standard Van", icon: "Truck" },
  "cargo_bike": { co2PerMile: 0.00, label: "Cargo Bike", icon: "Bike" },
  "click_collect": { co2PerMile: 0.00, label: "Click & Collect", icon: "Store" },
};

// Food miles origin estimates (UK-centric)
export const FOOD_MILES: Record<string, { miles: number; origin: string }> = {
  "banana": { miles: 5000, origin: "Central America" },
  "avocado": { miles: 5500, origin: "Mexico/Peru" },
  "mango": { miles: 5000, origin: "India/Brazil" },
  "pineapple": { miles: 5000, origin: "Costa Rica" },
  "orange": { miles: 1500, origin: "Spain" },
  "lemon": { miles: 1500, origin: "Spain/Italy" },
  "olive oil": { miles: 1500, origin: "Spain/Italy" },
  "rice": { miles: 6000, origin: "India/Thailand" },
  "coconut milk": { miles: 6000, origin: "Thailand/Philippines" },
  "coffee": { miles: 5500, origin: "Colombia/Ethiopia" },
  "tea": { miles: 6000, origin: "India/Kenya" },
  "prawns": { miles: 6000, origin: "Asia/Atlantic" },
  "tuna": { miles: 4000, origin: "Atlantic/Pacific" },
  "chocolate": { miles: 4000, origin: "West Africa" },
  "soy sauce": { miles: 6000, origin: "Japan/China" },
  "default_uk": { miles: 50, origin: "United Kingdom" },
  "default_eu": { miles: 800, origin: "Europe" },
  "default_world": { miles: 4000, origin: "Imported" },
};

// Average delivery distance in miles (UK grocery)
const DEFAULT_DELIVERY_MILES = 5;

type CarbonRating = "A" | "B" | "C" | "D" | "E";

// Weight estimates by unit type (kg)
const UNIT_WEIGHT_KG: Record<string, number> = {
  "kg": 1.0,
  "g": 0.001,
  "litre": 1.0,
  "liter": 1.0,
  "l": 1.0,
  "ml": 0.001,
  "pack": 0.5,
  "each": 0.3,
  "bunch": 0.3,
  "bottle": 1.0,
  "tin": 0.4,
  "can": 0.33,
  "bag": 0.5,
  "box": 0.5,
  "jar": 0.4,
  "tub": 0.5,
  "punnet": 0.25,
  "dozen": 0.72,
  "loaf": 0.8,
  "slice": 0.03,
};

function matchProductName(name: string): string | null {
  const normalised = name.toLowerCase().trim();

  // Direct match
  if (CARBON_PER_KG[normalised] !== undefined) {
    return normalised;
  }

  // Partial match — check if any key is contained in the product name
  const keys = Object.keys(CARBON_PER_KG);
  // Sort by length descending so "olive oil" matches before "oil"
  const sorted = keys.sort((a, b) => b.length - a.length);

  for (const key of sorted) {
    if (normalised.includes(key)) {
      return key;
    }
  }

  return null;
}

function estimateWeightKg(unit?: string): number {
  if (!unit) return 0.5;

  const normalised = unit.toLowerCase().trim();

  // Check for numeric prefix like "500g", "1.5kg", "200ml"
  const numericMatch = normalised.match(/^(\d+(?:\.\d+)?)\s*(kg|g|ml|l|litre|liter)$/);
  if (numericMatch) {
    const value = parseFloat(numericMatch[1]);
    const unitType = numericMatch[2];
    const multiplier = UNIT_WEIGHT_KG[unitType] ?? 1.0;
    return value * multiplier;
  }

  // Check for "x" packs like "6 x 330ml"
  const multipackMatch = normalised.match(/^(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)$/);
  if (multipackMatch) {
    const count = parseInt(multipackMatch[1], 10);
    const value = parseFloat(multipackMatch[2]);
    const unitType = multipackMatch[3];
    const multiplier = UNIT_WEIGHT_KG[unitType] ?? 1.0;
    return count * value * multiplier;
  }

  return UNIT_WEIGHT_KG[normalised] ?? 0.5;
}

function getCarbonRating(co2Kg: number): CarbonRating {
  if (co2Kg < 1) return "A";
  if (co2Kg < 3) return "B";
  if (co2Kg < 6) return "C";
  if (co2Kg < 15) return "D";
  return "E";
}

function lookupFoodMiles(matchedKey: string | null): { foodMiles?: number; origin?: string } {
  if (!matchedKey) return {};

  const entry = FOOD_MILES[matchedKey];
  if (entry) {
    return { foodMiles: entry.miles, origin: entry.origin };
  }

  return {};
}

export function estimateProductCarbon(product: {
  name: string;
  unit?: string;
  is_organic?: boolean;
  category_slug?: string;
}): { co2Kg: number; rating: CarbonRating; foodMiles?: number; origin?: string } {
  const matchedKey = matchProductName(product.name);
  const weightKg = estimateWeightKg(product.unit);

  let co2PerKg: number;

  if (matchedKey !== null) {
    co2PerKg = CARBON_PER_KG[matchedKey];
  } else if (product.category_slug && CARBON_CATEGORY_DEFAULTS[product.category_slug] !== undefined) {
    co2PerKg = CARBON_CATEGORY_DEFAULTS[product.category_slug];
  } else {
    // Global fallback: average grocery item
    co2PerKg = 2.0;
  }

  let co2Kg = co2PerKg * weightKg;

  // Organic farming typically produces ~10% less CO2 due to no synthetic fertiliser
  if (product.is_organic) {
    co2Kg *= 0.9;
  }

  // Round to 2 decimal places
  co2Kg = Math.round(co2Kg * 100) / 100;

  const { foodMiles, origin } = lookupFoodMiles(matchedKey);

  return {
    co2Kg,
    rating: getCarbonRating(co2Kg),
    foodMiles,
    origin,
  };
}

interface BasketItem {
  name: string;
  quantity: number;
  unit?: string;
  is_organic?: boolean;
  category_slug?: string;
}

interface ItemBreakdown {
  name: string;
  co2Kg: number;
  rating: CarbonRating;
}

interface BasketCarbonResult {
  totalCo2Kg: number;
  rating: CarbonRating;
  itemBreakdown: ItemBreakdown[];
  comparison: {
    carMiles: number;
    treeDays: number;
    showers: number;
  };
  deliveryCo2: Record<string, number>;
}

export function calculateBasketCarbon(items: BasketItem[]): BasketCarbonResult {
  const itemBreakdown: ItemBreakdown[] = [];
  let totalCo2Kg = 0;

  for (const item of items) {
    const { co2Kg, rating } = estimateProductCarbon(item);
    const itemTotal = co2Kg * item.quantity;
    totalCo2Kg += itemTotal;

    itemBreakdown.push({
      name: item.name,
      co2Kg: Math.round(itemTotal * 100) / 100,
      rating,
    });
  }

  totalCo2Kg = Math.round(totalCo2Kg * 100) / 100;

  // Real-world comparisons
  // Average car emits ~0.21 kg CO2 per mile (UK BEIS 2024)
  const carMiles = Math.round((totalCo2Kg / 0.21) * 10) / 10;
  // A mature tree absorbs ~22 kg CO2 per year = ~0.06 kg per day
  const treeDays = Math.round((totalCo2Kg / 0.06) * 10) / 10;
  // Average 8-minute shower uses ~1.7 kg CO2 (heating water)
  const showers = Math.round((totalCo2Kg / 1.7) * 10) / 10;

  // Delivery CO2 for each method
  const deliveryCo2: Record<string, number> = {};
  for (const [method, data] of Object.entries(DELIVERY_CARBON)) {
    deliveryCo2[method] = Math.round(data.co2PerMile * DEFAULT_DELIVERY_MILES * 100) / 100;
  }

  return {
    totalCo2Kg,
    rating: getCarbonRating(totalCo2Kg),
    itemBreakdown,
    comparison: { carMiles, treeDays, showers },
    deliveryCo2,
  };
}

export function formatCo2(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)}g CO\u2082`;
  return `${kg.toFixed(1)}kg CO\u2082`;
}
