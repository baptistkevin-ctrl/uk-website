import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Recipe, RecipeIngredient } from '@/data/recipes'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface PlannedMeal {
  recipeId: string
  recipeTitle: string
  recipeImage: string
  servings: number
  calories: number
  mealType: MealType
}

export interface ShoppingListItem {
  ingredientName: string
  totalQuantity: string
  unit: string
  category: string
  fromRecipes: string[]
  searchTerm: string
}

export interface ShoppingListResult {
  items: ShoppingListItem[]
  totalIngredients: number
  recipesUsed: number
}

interface MealPlannerStore {
  plan: Record<DayOfWeek, Record<MealType, PlannedMeal | null>>
  householdSize: number
  weekStartDate: string

  assignMeal: (
    day: DayOfWeek,
    mealType: MealType,
    recipe: Recipe,
    servings?: number,
  ) => void
  removeMeal: (day: DayOfWeek, mealType: MealType) => void
  clearDay: (day: DayOfWeek) => void
  clearWeek: () => void
  setHouseholdSize: (size: number) => void
  setWeekStartDate: (date: string) => void
  swapMeals: (
    from: { day: DayOfWeek; meal: MealType },
    to: { day: DayOfWeek; meal: MealType },
  ) => void

  getMealCount: () => number
  getDayCalories: (day: DayOfWeek) => number
  getWeekCalories: () => number
  getWeekNutrition: () => {
    calories: number
    mealsPlanned: number
    daysWithMeals: number
  }

  generateShoppingList: (recipes: Recipe[]) => ShoppingListResult
}

export const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

function createEmptyPlan(): Record<
  DayOfWeek,
  Record<MealType, PlannedMeal | null>
> {
  const plan = {} as Record<DayOfWeek, Record<MealType, PlannedMeal | null>>
  for (const day of DAYS) {
    plan[day] = {} as Record<MealType, PlannedMeal | null>
    for (const meal of MEALS) {
      plan[day][meal] = null
    }
  }
  return plan
}

function parseQuantity(qty: string): { value: number; prefix: string } {
  const match = qty.match(/^([\d.]+)/)
  if (!match) return { value: 0, prefix: '' }
  return { value: parseFloat(match[1]), prefix: '' }
}

function formatQuantity(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100
  const display = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)

  if (unit === 'g' || unit === 'ml') return `${display}${unit}`
  if (unit === 'tbsp' || unit === 'tsp') return `${display} ${unit}`
  if (unit === 'cloves') return `${display} cloves`
  if (unit === 'pieces') return display
  return `${display} ${unit}`
}

export const useMealPlannerStore = create<MealPlannerStore>()(
  persist(
    (set, get) => ({
      plan: createEmptyPlan(),
      householdSize: 2,
      weekStartDate: getCurrentMonday(),

      assignMeal: (day, mealType, recipe, servings) => {
        const resolvedServings = servings ?? get().householdSize
        const caloriesPerServing = recipe.calories / recipe.servings
        const totalCalories = Math.round(caloriesPerServing * resolvedServings)

        set((state) => ({
          plan: {
            ...state.plan,
            [day]: {
              ...state.plan[day],
              [mealType]: {
                recipeId: recipe.id,
                recipeTitle: recipe.title,
                recipeImage: recipe.imageUrl,
                servings: resolvedServings,
                calories: totalCalories,
                mealType,
              } satisfies PlannedMeal,
            },
          },
        }))
      },

      removeMeal: (day, mealType) => {
        set((state) => ({
          plan: {
            ...state.plan,
            [day]: {
              ...state.plan[day],
              [mealType]: null,
            },
          },
        }))
      },

      clearDay: (day) => {
        const emptyDay = {} as Record<MealType, PlannedMeal | null>
        for (const meal of MEALS) {
          emptyDay[meal] = null
        }
        set((state) => ({
          plan: {
            ...state.plan,
            [day]: emptyDay,
          },
        }))
      },

      clearWeek: () => {
        set({ plan: createEmptyPlan() })
      },

      setHouseholdSize: (size) => {
        set({ householdSize: Math.max(1, Math.min(size, 20)) })
      },

      setWeekStartDate: (date) => {
        set({ weekStartDate: date })
      },

      swapMeals: (from, to) => {
        set((state) => {
          const fromMeal = state.plan[from.day][from.meal]
          const toMeal = state.plan[to.day][to.meal]

          return {
            plan: {
              ...state.plan,
              [from.day]: {
                ...state.plan[from.day],
                [from.meal]: toMeal,
              },
              [to.day]: {
                ...state.plan[to.day],
                [to.meal]: fromMeal,
              },
            },
          }
        })
      },

      getMealCount: () => {
        const { plan } = get()
        let count = 0
        for (const day of DAYS) {
          for (const meal of MEALS) {
            if (plan[day][meal]) count++
          }
        }
        return count
      },

      getDayCalories: (day) => {
        const { plan } = get()
        let total = 0
        for (const meal of MEALS) {
          const planned = plan[day][meal]
          if (planned) total += planned.calories
        }
        return total
      },

      getWeekCalories: () => {
        const { plan } = get()
        let total = 0
        for (const day of DAYS) {
          for (const meal of MEALS) {
            const planned = plan[day][meal]
            if (planned) total += planned.calories
          }
        }
        return total
      },

      getWeekNutrition: () => {
        const { plan } = get()
        let calories = 0
        let mealsPlanned = 0
        const daysSet = new Set<DayOfWeek>()

        for (const day of DAYS) {
          for (const meal of MEALS) {
            const planned = plan[day][meal]
            if (planned) {
              calories += planned.calories
              mealsPlanned++
              daysSet.add(day)
            }
          }
        }

        return {
          calories,
          mealsPlanned,
          daysWithMeals: daysSet.size,
        }
      },

      generateShoppingList: (recipes) => {
        const { plan } = get()

        const recipeMap = new Map<string, Recipe>()
        for (const recipe of recipes) {
          recipeMap.set(recipe.id, recipe)
        }

        const aggregated = new Map<
          string,
          {
            ingredientName: string
            totalValue: number
            unit: string
            category: string
            fromRecipes: Set<string>
            searchTerm: string
          }
        >()

        const recipesUsed = new Set<string>()

        for (const day of DAYS) {
          for (const meal of MEALS) {
            const planned = plan[day][meal]
            if (!planned) continue

            const recipe = recipeMap.get(planned.recipeId)
            if (!recipe) continue

            recipesUsed.add(recipe.id)
            const scaleFactor = planned.servings / recipe.servings

            for (const ingredient of recipe.ingredients) {
              const key = `${ingredient.searchTerm}__${ingredient.unit}`
              const parsed = parseQuantity(ingredient.quantity)
              const scaledValue = parsed.value * scaleFactor

              const existing = aggregated.get(key)
              if (existing) {
                existing.totalValue += scaledValue
                existing.fromRecipes.add(recipe.title)
              } else {
                aggregated.set(key, {
                  ingredientName: ingredient.name,
                  totalValue: scaledValue,
                  unit: ingredient.unit,
                  category: ingredient.category,
                  fromRecipes: new Set([recipe.title]),
                  searchTerm: ingredient.searchTerm,
                })
              }
            }
          }
        }

        const items: ShoppingListItem[] = Array.from(aggregated.values())
          .map((entry) => ({
            ingredientName: entry.ingredientName,
            totalQuantity: formatQuantity(entry.totalValue, entry.unit),
            unit: entry.unit,
            category: entry.category,
            fromRecipes: Array.from(entry.fromRecipes),
            searchTerm: entry.searchTerm,
          }))
          .sort((a, b) => a.category.localeCompare(b.category))

        return {
          items,
          totalIngredients: items.length,
          recipesUsed: recipesUsed.size,
        }
      },
    }),
    {
      name: 'uk-grocery-meal-planner',
      version: 1,
    },
  ),
)

function getCurrentMonday(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}
