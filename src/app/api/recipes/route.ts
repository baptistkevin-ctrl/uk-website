import { NextRequest, NextResponse } from 'next/server'
import { filterRecipes } from '@/data/recipes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category') || undefined
  const dietary = searchParams.get('dietary') || undefined
  const cuisine = searchParams.get('cuisine') || undefined
  const search = searchParams.get('search') || undefined

  try {
    const recipes = filterRecipes({ category, dietary, cuisine, search })

    return NextResponse.json(
      {
        recipes,
        total: recipes.length,
        filters: {
          category: category || null,
          dietary: dietary || null,
          cuisine: cuisine || null,
          search: search || null,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      },
    )
  } catch (error) {
    console.error('Recipes API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 },
    )
  }
}
