import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { validateData, formatZodErrors } from '@/lib/validation/schemas'
import { sanitizeText, checkRateLimit, rateLimitConfigs, addRateLimitHeaders } from '@/lib/security'

export const dynamic = 'force-dynamic'

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
}

const communityRecipeCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  imageUrl: z.string().url('Invalid image URL').max(2048).optional().or(z.literal('')),
  prepTime: z.number().int().min(0).max(1440),
  cookTime: z.number().int().min(0).max(1440),
  servings: z.number().int().min(1).max(100),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  cuisine: z.string().min(1).max(50),
  dietary: z.array(z.string().max(30)).max(10).default([]),
  categories: z.array(z.string().max(50)).min(1, 'At least one category required').max(5),
  ingredients: z.array(z.object({
    name: z.string().min(1).max(100),
    quantity: z.string().min(1).max(20),
    unit: z.string().min(1).max(20),
    searchTerm: z.string().min(1).max(100),
  })).min(1, 'At least one ingredient required').max(30),
  steps: z.array(z.string().min(1).max(500)).min(1, 'At least one step required').max(20),
  tips: z.array(z.string().max(300)).max(10).default([]),
})

// GET /api/community-recipes — List with filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sort = searchParams.get('sort') || 'top'
  const category = searchParams.get('category')
  const dietary = searchParams.get('dietary')
  const search = searchParams.get('search')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const offset = (page - 1) * limit

  // Try to read from localStorage-backed store data sent as header, otherwise return empty
  // Since this is a server route, we return a standardised response format
  // The client-side store is the primary source — this API enables server-side operations

  try {
    // Return metadata for client to use with its local store
    return NextResponse.json({
      success: true,
      filters: { sort, category, dietary, search, limit, page, offset },
      message: 'Use client-side store as primary. This endpoint accepts filters for future DB migration.',
      data: [],
    })
  } catch (error) {
    console.error('Community recipes GET error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch recipes', details: null } },
      { status: 500 }
    )
  }
}

// POST /api/community-recipes — Submit a new recipe
export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, rateLimitConfigs.sensitive)
  if (!rateLimitResult.allowed) {
    const response = NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.', details: null } },
      { status: 429 }
    )
    addRateLimitHeaders(response, rateLimitResult)
    return response
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Please sign in to submit a recipe', details: null } },
      { status: 401 }
    )
  }

  // CSRF check — verify origin header
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Invalid request origin', details: null } },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body', details: null } },
      { status: 400 }
    )
  }

  const validation = validateData(communityRecipeCreateSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid recipe data', details: formatZodErrors(validation.errors) } },
      { status: 400 }
    )
  }

  const data = validation.data

  const sanitizedRecipe = {
    title: sanitizeText(data.title),
    description: sanitizeText(data.description),
    imageUrl: data.imageUrl || '',
    prepTime: data.prepTime,
    cookTime: data.cookTime,
    servings: data.servings,
    difficulty: data.difficulty,
    cuisine: sanitizeText(data.cuisine),
    dietary: data.dietary.map(sanitizeText),
    categories: data.categories.map(sanitizeText),
    ingredients: data.ingredients.map((i) => ({
      name: sanitizeText(i.name),
      quantity: sanitizeText(i.quantity),
      unit: sanitizeText(i.unit),
      searchTerm: sanitizeText(i.searchTerm),
    })),
    steps: data.steps.map(sanitizeText),
    tips: data.tips.map(sanitizeText),
    authorId: user.id,
    authorName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
    authorAvatar: user.user_metadata?.avatar_url,
  }

  const recipeId = `cr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const recipe = {
    id: recipeId,
    ...sanitizedRecipe,
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
    status: 'published' as const,
  }

  const response = NextResponse.json({
    success: true,
    data: recipe,
    message: 'Recipe created. Store on client side.',
  }, { status: 201 })

  addRateLimitHeaders(response, rateLimitResult)
  return response
}
