// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Dynamic Personalization Engine
//  Time, season, and weather-aware homepage curation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type WeatherMood = "sunny" | "rainy" | "cold" | "hot" | "mild";

export interface PersonalizationContext {
  timeOfDay: TimeOfDay;
  season: Season;
  weatherMood: WeatherMood;
  dayOfWeek: string;
  isWeekend: boolean;
  hour: number;
  month: number;
}

export interface PersonalizedSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  categorySlug?: string;
  searchTerms: string[];
  priority: number;
  bgColor?: string;
}

const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function resolveTimeOfDay(hour: number): TimeOfDay {
  if (hour < 10) return "morning";
  if (hour < 14) return "afternoon";
  if (hour < 19) return "evening";
  return "night";
}

function resolveSeason(month: number): Season {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function resolveWeatherMood(season: Season): WeatherMood {
  const roll = Math.random();

  switch (season) {
    case "summer":
      return roll > 0.3 ? "sunny" : "mild";
    case "winter":
      return roll > 0.4 ? "cold" : "rainy";
    case "autumn":
      return roll > 0.5 ? "rainy" : "mild";
    default:
      return "mild";
  }
}

export function getPersonalizationContext(): PersonalizationContext {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth();
  const dayIndex = now.getDay();

  return {
    timeOfDay: resolveTimeOfDay(hour),
    season: resolveSeason(month),
    weatherMood: resolveWeatherMood(resolveSeason(month)),
    dayOfWeek: DAYS_OF_WEEK[dayIndex],
    isWeekend: dayIndex === 0 || dayIndex === 6,
    hour,
    month,
  };
}

// ─── Section builders ────────────────────────────────

function buildTimeSections(ctx: PersonalizationContext): PersonalizedSection[] {
  const map: Record<TimeOfDay, PersonalizedSection> = {
    morning: {
      id: "morning-essentials",
      title: "Good Morning!",
      subtitle: "Start your day right with these breakfast picks",
      icon: "Coffee",
      searchTerms: [
        "eggs", "bread", "milk", "cereal", "oats", "juice",
        "yogurt", "butter", "bacon", "croissant", "bagel", "coffee", "tea",
      ],
      priority: 100,
    },
    afternoon: {
      id: "lunch-ideas",
      title: "Lunch Time!",
      subtitle: "Quick and easy lunch options",
      icon: "UtensilsCrossed",
      searchTerms: [
        "bread", "cheese", "salad", "soup", "sandwich", "wrap",
        "tomato", "cucumber", "lettuce", "chicken",
      ],
      priority: 100,
    },
    evening: {
      id: "dinner-tonight",
      title: "What's for Dinner?",
      subtitle: "Fresh ingredients for tonight's meal",
      icon: "ChefHat",
      searchTerms: [
        "chicken", "beef", "salmon", "pasta", "rice", "vegetables",
        "garlic", "onion", "tomato", "pepper", "broccoli", "steak",
      ],
      priority: 100,
    },
    night: {
      id: "evening-treats",
      title: "Evening Treats",
      subtitle: "Snacks and treats for tonight",
      icon: "Moon",
      searchTerms: [
        "chocolate", "ice cream", "crisps", "biscuits", "wine",
        "beer", "popcorn", "nuts", "cheese",
      ],
      priority: 100,
    },
  };

  return [map[ctx.timeOfDay]];
}

function buildWeatherSections(ctx: PersonalizationContext): PersonalizedSection[] {
  if (ctx.weatherMood === "rainy" || ctx.weatherMood === "cold") {
    return [
      {
        id: "comfort-food",
        title: "Cosy Comfort Food",
        subtitle: "Warm up with hearty meals on this chilly day",
        icon: "CloudRain",
        searchTerms: [
          "soup", "stew", "pie", "pasta", "beans", "sausage",
          "potato", "bread", "chocolate", "tea", "coffee",
        ],
        priority: 90,
      },
    ];
  }

  if (ctx.weatherMood === "sunny" || ctx.weatherMood === "hot") {
    return [
      {
        id: "summer-picks",
        title: "Perfect for Sunny Days",
        subtitle: "Fresh picks for the beautiful weather",
        icon: "Sun",
        searchTerms: [
          "salad", "fruit", "ice cream", "water", "juice", "berries",
          "watermelon", "cucumber", "bbq", "burger", "corn",
        ],
        priority: 90,
      },
    ];
  }

  return [];
}

function buildWeekendSections(ctx: PersonalizationContext): PersonalizedSection[] {
  if (!ctx.isWeekend) return [];

  return [
    {
      id: "weekend-cooking",
      title: "Weekend Cooking",
      subtitle: "Take your time with something special",
      icon: "Timer",
      searchTerms: [
        "steak", "salmon", "roast", "chicken", "wine", "cheese",
        "cream", "butter", "herbs", "chocolate",
      ],
      priority: 85,
    },
  ];
}

function buildSeasonalSections(ctx: PersonalizationContext): PersonalizedSection[] {
  const map: Record<Season, PersonalizedSection> = {
    summer: {
      id: "bbq-season",
      title: "BBQ Season",
      subtitle: "Everything you need for the grill",
      icon: "Flame",
      searchTerms: [
        "burger", "sausage", "chicken", "corn", "salad",
        "buns", "ketchup", "coleslaw",
      ],
      priority: 80,
    },
    winter: {
      id: "winter-warmers",
      title: "Winter Warmers",
      subtitle: "Hearty meals for cold nights",
      icon: "Snowflake",
      searchTerms: [
        "soup", "stew", "pie", "roast", "potato",
        "gravy", "pudding", "hot chocolate",
      ],
      priority: 80,
    },
    autumn: {
      id: "autumn-harvest",
      title: "Autumn Harvest",
      subtitle: "Seasonal produce at its best",
      icon: "Leaf",
      searchTerms: [
        "pumpkin", "squash", "apple", "mushroom",
        "parsnip", "turnip", "blackberry",
      ],
      priority: 80,
    },
    spring: {
      id: "spring-fresh",
      title: "Spring Fresh",
      subtitle: "New season produce has arrived",
      icon: "Sprout",
      searchTerms: [
        "asparagus", "peas", "spinach", "strawberry",
        "lamb", "mint", "rhubarb",
      ],
      priority: 80,
    },
  };

  return [map[ctx.season]];
}

function buildAlwaysOnSections(): PersonalizedSection[] {
  return [
    {
      id: "deals-for-you",
      title: "Deals For You",
      subtitle: "Products on special offer right now",
      icon: "Tag",
      searchTerms: [],
      priority: 75,
    },
    {
      id: "weekly-essentials",
      title: "Weekly Essentials",
      subtitle: "The staples every household needs",
      icon: "ShoppingBasket",
      searchTerms: [
        "milk", "bread", "eggs", "butter", "cheese",
        "chicken", "rice", "pasta", "tomato", "onion",
      ],
      priority: 70,
    },
  ];
}

export function getPersonalizedSections(
  ctx: PersonalizationContext,
): PersonalizedSection[] {
  const sections = [
    ...buildTimeSections(ctx),
    ...buildWeatherSections(ctx),
    ...buildWeekendSections(ctx),
    ...buildSeasonalSections(ctx),
    ...buildAlwaysOnSections(),
  ];

  return sections.sort((a, b) => b.priority - a.priority);
}

// ─── Greeting ────────────────────────────────────────

export function getGreeting(name?: string): string {
  const ctx = getPersonalizationContext();
  const who = name ? `, ${name}` : "";

  const greetings: Record<TimeOfDay, string> = {
    morning: `Good morning${who}!`,
    afternoon: `Good afternoon${who}!`,
    evening: `Good evening${who}!`,
    night: `Evening${who}!`,
  };

  return greetings[ctx.timeOfDay];
}

// ─── Seasonal banner ────────────────────────────────

export interface SeasonalBanner {
  title: string;
  subtitle: string;
  bgGradient: string;
}

export function getSeasonalBanner(
  ctx: PersonalizationContext,
): SeasonalBanner | null {
  if (ctx.season === "summer" && ctx.weatherMood === "sunny") {
    return {
      title: "Summer Sale",
      subtitle: "Up to 30% off BBQ essentials",
      bgGradient: "from-amber-500 to-orange-500",
    };
  }

  if (ctx.season === "winter" && ctx.month === 11) {
    return {
      title: "Christmas Shop",
      subtitle: "Everything for the festive season",
      bgGradient: "from-red-600 to-red-800",
    };
  }

  return null;
}
