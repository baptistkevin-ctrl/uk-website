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

const commentCreateSchema = z.object({
  message: z.string().min(2, 'Comment must be at least 2 characters').max(1000, 'Comment too long'),
  rating: z.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  photoUrl: z.string().url('Invalid photo URL').max(2048).optional().or(z.literal('')),
})

// GET /api/community-recipes/[id]/comments — Get comments for a recipe
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params

  if (!recipeId || typeof recipeId !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Recipe ID is required', details: null } },
      { status: 400 }
    )
  }

  // Comments are stored client-side. This endpoint returns the recipe ID
  // for the client to look up comments in its local store.
  return NextResponse.json({
    success: true,
    recipeId,
    message: 'Look up comments in client-side store by recipe ID.',
    data: [],
  })
}

// POST /api/community-recipes/[id]/comments — Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params

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
      { error: { code: 'UNAUTHORIZED', message: 'Please sign in to comment', details: null } },
      { status: 401 }
    )
  }

  // CSRF check
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Invalid request origin', details: null } },
      { status: 403 }
    )
  }

  if (!recipeId || typeof recipeId !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Recipe ID is required', details: null } },
      { status: 400 }
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

  const validation = validateData(commentCreateSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid comment data', details: formatZodErrors(validation.errors) } },
      { status: 400 }
    )
  }

  const data = validation.data

  const comment = {
    id: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    recipeId,
    authorId: user.id,
    authorName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
    message: sanitizeText(data.message),
    rating: data.rating,
    photoUrl: data.photoUrl || undefined,
    createdAt: new Date().toISOString(),
  }

  const response = NextResponse.json({
    success: true,
    data: comment,
    message: 'Comment created. Store on client side.',
  }, { status: 201 })

  addRateLimitHeaders(response, rateLimitResult)
  return response
}
