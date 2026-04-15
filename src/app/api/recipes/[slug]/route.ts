import { NextRequest, NextResponse } from 'next/server'
import { findRecipeBySlug } from '@/data/recipes'
import { getSupabaseAdmin } from '@/lib/supabase/server'

interface MatchedProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  unit: string | null
}

interface IngredientMatch {
  ingredientName: string
  searchTerm: string
  category: string
  optional: boolean
  matchedProduct: MatchedProduct | null
  alternatives: MatchedProduct[]
}

function mapProduct(product: Record<string, unknown>): MatchedProduct {
  return {
    id: product.id as string,
    name: product.name as string,
    slug: product.slug as string,
    price_pence: product.price_pence as number,
    image_url: (product.image_url as string) || null,
    unit: (product.unit as string) || null,
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  try {
    const recipe = findRecipeBySlug(slug)

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 },
      )
    }

    const supabase = getSupabaseAdmin()
    const ingredientMatches: IngredientMatch[] = []

    const matchPromises = recipe.ingredients.map(async (ingredient) => {
      const match: IngredientMatch = {
        ingredientName: ingredient.name,
        searchTerm: ingredient.searchTerm,
        category: ingredient.category,
        optional: ingredient.optional ?? false,
        matchedProduct: null,
        alternatives: [],
      }

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, slug, price_pence, image_url, unit')
        .eq('is_active', true)
        .ilike('name', `%${ingredient.searchTerm}%`)
        .order('price_pence', { ascending: true })
        .limit(4)

      if (error) {
        console.error(
          `Product search failed for "${ingredient.searchTerm}":`,
          error.message,
        )
        return match
      }

      if (products && products.length > 0) {
        match.matchedProduct = mapProduct(products[0])
        match.alternatives = products.slice(1, 4).map(mapProduct)
      }

      return match
    })

    const results = await Promise.all(matchPromises)
    ingredientMatches.push(...results)

    const matchedCount = ingredientMatches.filter(
      (m) => m.matchedProduct !== null,
    ).length
    const totalIngredients = ingredientMatches.length
    const estimatedTotalPence = ingredientMatches.reduce(
      (sum, m) => sum + (m.matchedProduct?.price_pence ?? 0),
      0,
    )

    return NextResponse.json(
      {
        recipe,
        ingredientMatches,
        summary: {
          matchedCount,
          totalIngredients,
          matchPercentage: Math.round((matchedCount / totalIngredients) * 100),
          estimatedTotalPence,
          estimatedTotalFormatted: `£${(estimatedTotalPence / 100).toFixed(2)}`,
        },
      },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    )
  } catch (error) {
    console.error('Recipe detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipe details' },
      { status: 500 },
    )
  }
}
