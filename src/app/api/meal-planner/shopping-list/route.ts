import { NextRequest, NextResponse } from 'next/server'
import { RECIPES } from '@/data/recipes'
import type { Recipe } from '@/data/recipes'
import { getSupabaseAdmin } from '@/lib/supabase/server'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

const VALID_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

const VALID_MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

interface PlanEntry {
  recipeId: string
  servings: number
}

interface ShoppingListItem {
  ingredientName: string
  totalQuantity: string
  unit: string
  category: string
  fromRecipes: string[]
  searchTerm: string
}

interface MatchedProduct {
  ingredientName: string
  product: {
    id: string
    name: string
    slug: string
    price_pence: number
    image_url: string | null
    unit: string | null
    unit_value: number | null
    stock_quantity: number
  } | null
}

function parseQuantityValue(qty: string): number {
  const match = qty.match(/^([\d.]+)/)
  if (!match) return 0
  return parseFloat(match[1])
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

function buildShoppingList(
  plan: Record<DayOfWeek, Record<MealType, PlanEntry | null>>,
): { items: ShoppingListItem[]; recipesUsed: number } {
  const recipeMap = new Map<string, Recipe>()
  for (const recipe of RECIPES) {
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

  for (const day of VALID_DAYS) {
    const dayPlan = plan[day]
    if (!dayPlan) continue

    for (const meal of VALID_MEALS) {
      const entry = dayPlan[meal]
      if (!entry) continue

      const recipe = recipeMap.get(entry.recipeId)
      if (!recipe) continue

      recipesUsed.add(recipe.id)
      const scaleFactor = entry.servings / recipe.servings

      for (const ingredient of recipe.ingredients) {
        const key = `${ingredient.searchTerm}__${ingredient.unit}`
        const parsed = parseQuantityValue(ingredient.quantity)
        const scaledValue = parsed * scaleFactor

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

  return { items, recipesUsed: recipesUsed.size }
}

function validatePlan(
  body: unknown,
): body is {
  plan: Record<DayOfWeek, Record<MealType, PlanEntry | null>>
} {
  if (!body || typeof body !== 'object') return false

  const { plan } = body as { plan: unknown }
  if (!plan || typeof plan !== 'object') return false

  const planRecord = plan as Record<string, unknown>

  for (const day of VALID_DAYS) {
    const dayPlan = planRecord[day]
    if (!dayPlan || typeof dayPlan !== 'object') continue

    const dayRecord = dayPlan as Record<string, unknown>
    for (const meal of VALID_MEALS) {
      const entry = dayRecord[meal]
      if (entry === null || entry === undefined) continue

      if (typeof entry !== 'object') return false

      const mealEntry = entry as Record<string, unknown>
      if (typeof mealEntry.recipeId !== 'string') return false
      if (typeof mealEntry.servings !== 'number' || mealEntry.servings < 1)
        return false
    }
  }

  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!validatePlan(body)) {
      return NextResponse.json(
        {
          error: 'Invalid plan format',
          details:
            'Expected { plan: Record<DayOfWeek, Record<MealType, { recipeId: string, servings: number } | null>> }',
        },
        { status: 400 },
      )
    }

    const { items, recipesUsed } = buildShoppingList(body.plan)

    if (items.length === 0) {
      return NextResponse.json({
        shoppingList: [],
        matchedProducts: [],
        summary: {
          totalIngredients: 0,
          recipesUsed: 0,
          productsMatched: 0,
        },
      })
    }

    const searchTerms = items.map((item) => item.searchTerm)

    let matchedProducts: MatchedProduct[] = []

    try {
      const supabase = getSupabaseAdmin()

      const searchPromises = searchTerms.map(async (term, index) => {
        const { data } = await supabase
          .from('products')
          .select(
            'id, name, slug, price_pence, image_url, unit, unit_value, stock_quantity',
          )
          .ilike('name', `%${term}%`)
          .eq('is_active', true)
          .gt('stock_quantity', 0)
          .order('price_pence', { ascending: true })
          .limit(1)

        const product = data && data.length > 0 ? data[0] : null

        return {
          ingredientName: items[index].ingredientName,
          product,
        } satisfies MatchedProduct
      })

      matchedProducts = await Promise.all(searchPromises)
    } catch {
      matchedProducts = items.map((item) => ({
        ingredientName: item.ingredientName,
        product: null,
      }))
    }

    const productsMatched = matchedProducts.filter((m) => m.product !== null).length

    return NextResponse.json({
      shoppingList: items,
      matchedProducts,
      summary: {
        totalIngredients: items.length,
        recipesUsed,
        productsMatched,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate shopping list' },
      { status: 500 },
    )
  }
}
