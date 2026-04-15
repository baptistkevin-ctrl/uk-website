export type WeatherCondition =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "stormy"
  | "snowy"
  | "cold"
  | "hot"
  | "windy"
  | "mild"
  | "foggy"

export interface WeatherState {
  condition: WeatherCondition
  temperature: number
  feelsLike: number
  humidity: number
  description: string
  icon: string
  isGoodWeather: boolean
  location: string
  updatedAt: string
}

export interface WeatherPromotion {
  id: string
  title: string
  subtitle: string
  emoji: string
  icon: string
  bgGradient: string
  textColor: string
  searchTerms: string[]
  categorySlug?: string
  discountLabel?: string
  priority: number
}

const UK_TEMP_RANGES: Record<number, [number, number]> = {
  0: [1, 7],
  1: [2, 8],
  2: [4, 11],
  3: [6, 14],
  4: [9, 17],
  5: [12, 20],
  6: [14, 23],
  7: [14, 22],
  8: [11, 19],
  9: [8, 14],
  10: [4, 10],
  11: [2, 7],
}

const CONDITION_META: Record<
  WeatherCondition,
  { desc: string; icon: string; isGood: boolean }
> = {
  sunny: { desc: "Sunny", icon: "Sun", isGood: true },
  cloudy: { desc: "Cloudy", icon: "Cloud", isGood: false },
  rainy: { desc: "Rainy", icon: "CloudRain", isGood: false },
  stormy: { desc: "Stormy", icon: "CloudLightning", isGood: false },
  snowy: { desc: "Snowy", icon: "Snowflake", isGood: false },
  cold: { desc: "Cold", icon: "Thermometer", isGood: false },
  hot: { desc: "Hot", icon: "Sun", isGood: true },
  windy: { desc: "Windy", icon: "Wind", isGood: false },
  mild: { desc: "Mild", icon: "CloudSun", isGood: true },
  foggy: { desc: "Foggy", icon: "CloudFog", isGood: false },
}

function resolveWinterCondition(temp: number, rand: number): WeatherCondition {
  if (temp <= 2) return "snowy"
  if (rand < 0.35) return "rainy"
  if (rand < 0.6) return "cold"
  if (rand < 0.8) return "cloudy"
  return "mild"
}

function resolveSpringCondition(rand: number): WeatherCondition {
  if (rand < 0.25) return "rainy"
  if (rand < 0.5) return "mild"
  if (rand < 0.7) return "sunny"
  return "cloudy"
}

function resolveSummerCondition(temp: number, rand: number): WeatherCondition {
  if (rand < 0.15) return "rainy"
  if (rand < 0.3) return "cloudy"
  if (rand < 0.6) return "sunny"
  if (temp >= 25) return "hot"
  return "mild"
}

function resolveAutumnCondition(rand: number): WeatherCondition {
  if (rand < 0.35) return "rainy"
  if (rand < 0.55) return "windy"
  if (rand < 0.75) return "cloudy"
  return "mild"
}

function resolveCondition(
  month: number,
  temp: number,
  rand: number
): WeatherCondition {
  if (month >= 11 || month <= 1) return resolveWinterCondition(temp, rand)
  if (month <= 4) return resolveSpringCondition(rand)
  if (month <= 7) return resolveSummerCondition(temp, rand)
  return resolveAutumnCondition(rand)
}

function computeFeelsLike(temp: number, condition: WeatherCondition): number {
  if (condition === "windy") return temp - 3
  if (condition === "rainy") return temp - 2
  return temp
}

function computeHumidity(condition: WeatherCondition, rand: number): number {
  if (condition === "rainy" || condition === "stormy") {
    return 85 + Math.round(rand * 10)
  }
  return 50 + Math.round(rand * 30)
}

/**
 * Simulate realistic UK weather based on month and seasonal patterns.
 * Designed as a drop-in replacement — swap this function body with a
 * real API call (OpenWeatherMap / Met Office) when ready.
 */
export function simulateUKWeather(month?: number): WeatherState {
  const m = month ?? new Date().getMonth()
  const rand = Math.random()

  const [minT, maxT] = UK_TEMP_RANGES[m] ?? [8, 15]
  const temp = Math.round(minT + rand * (maxT - minT))
  const condition = resolveCondition(m, temp, rand)
  const meta = CONDITION_META[condition]

  return {
    condition,
    temperature: temp,
    feelsLike: computeFeelsLike(temp, condition),
    humidity: computeHumidity(condition, rand),
    description: `${meta.desc} and ${temp}°C`,
    icon: meta.icon,
    isGoodWeather: meta.isGood,
    location: "London, UK",
    updatedAt: new Date().toISOString(),
  }
}

function rainyPromo(): WeatherPromotion {
  return {
    id: "rainy-comfort",
    title: "Rainy Day Comfort Food",
    subtitle: "Warm up with hearty meals on this wet day",
    emoji: "🌧️",
    icon: "CloudRain",
    bgGradient: "linear-gradient(135deg, #0F4023, #1C1C1E)",
    textColor: "text-white",
    searchTerms: [
      "soup", "stew", "pie", "pasta", "beans",
      "bread", "chocolate", "tea", "coffee", "porridge",
    ],
    discountLabel: "Cosy picks for a rainy day",
    priority: 100,
  }
}

function sunnyPromo(): WeatherPromotion {
  return {
    id: "sunny-fresh",
    title: "Perfect BBQ Weather!",
    subtitle: "Stock up for the sunshine",
    emoji: "☀️",
    icon: "Sun",
    bgGradient: "linear-gradient(135deg, #E8861A, #C96E0A)",
    textColor: "text-white",
    searchTerms: [
      "burger", "sausage", "salad", "corn", "ice cream",
      "lemonade", "watermelon", "berries", "chicken", "buns",
    ],
    discountLabel: "BBQ essentials on offer",
    priority: 100,
  }
}

function coldDrinksPromo(): WeatherPromotion {
  return {
    id: "cold-drinks",
    title: "Stay Cool",
    subtitle: "Refreshing drinks and treats",
    emoji: "🧊",
    icon: "Droplets",
    bgGradient: "linear-gradient(135deg, #1B6B3A, #155630)",
    textColor: "text-white",
    searchTerms: ["water", "juice", "ice cream", "fruit", "smoothie", "lemonade"],
    priority: 85,
  }
}

function winterWarmersPromo(temp: number): WeatherPromotion {
  return {
    id: "winter-warmers",
    title: "Winter Warmers",
    subtitle: `It's ${temp}°C — warm up with these`,
    emoji: "❄️",
    icon: "Snowflake",
    bgGradient: "linear-gradient(135deg, #0F4023, #1C1C1E)",
    textColor: "text-white",
    searchTerms: [
      "soup", "stew", "hot chocolate", "porridge",
      "pie", "roast", "potato", "gravy", "bread",
    ],
    discountLabel: "Warming meals for cold weather",
    priority: 100,
  }
}

function freshHealthyPromo(): WeatherPromotion {
  return {
    id: "fresh-healthy",
    title: "Fresh & Healthy Picks",
    subtitle: "Perfect day for something light and fresh",
    emoji: "🌿",
    icon: "Leaf",
    bgGradient: "linear-gradient(135deg, #1B6B3A, #0F4023)",
    textColor: "text-white",
    searchTerms: [
      "salad", "fruit", "vegetables", "yogurt",
      "chicken", "fish", "avocado", "spinach",
    ],
    priority: 80,
  }
}

function stayInPromo(): WeatherPromotion {
  return {
    id: "stay-in",
    title: "Stay In & Cook",
    subtitle: "Windy outside — cook something delicious at home",
    emoji: "💨",
    icon: "Wind",
    bgGradient: "linear-gradient(135deg, #1C1C1E, #0F4023)",
    textColor: "text-white",
    searchTerms: [
      "pasta", "rice", "curry", "chicken",
      "vegetables", "garlic", "onion", "tomato",
    ],
    priority: 85,
  }
}

function essentialsPromo(): WeatherPromotion {
  return {
    id: "essentials",
    title: "Weekly Essentials",
    subtitle: "Stock up on the basics",
    emoji: "🛒",
    icon: "ShoppingBasket",
    bgGradient: "linear-gradient(135deg, #1B6B3A, #0F4023)",
    textColor: "text-white",
    searchTerms: [
      "milk", "bread", "eggs", "butter",
      "cheese", "chicken", "rice", "pasta",
    ],
    priority: 60,
  }
}

/** Map current weather state to relevant promotions, sorted by priority. */
export function getWeatherPromotions(weather: WeatherState): WeatherPromotion[] {
  const promos: WeatherPromotion[] = []

  if (weather.condition === "rainy" || weather.condition === "stormy") {
    promos.push(rainyPromo())
  }

  if (weather.condition === "sunny" || weather.condition === "hot") {
    promos.push(sunnyPromo())
    promos.push(coldDrinksPromo())
  }

  if (weather.condition === "cold" || weather.condition === "snowy") {
    promos.push(winterWarmersPromo(weather.temperature))
  }

  if (weather.condition === "mild" || weather.condition === "cloudy") {
    promos.push(freshHealthyPromo())
  }

  if (weather.condition === "windy") {
    promos.push(stayInPromo())
  }

  promos.push(essentialsPromo())

  return promos.sort((a, b) => b.priority - a.priority)
}
