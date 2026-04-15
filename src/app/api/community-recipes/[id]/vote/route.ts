import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { validateData, formatZodErrors } from '@/lib/validation/schemas'
import { checkRateLimit, rateLimitConfigs, addRateLimitHeaders } from '@/lib/security'

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

const voteSchema = z.object({
  vote: z.enum(['up', 'down', 'remove'] as const),
})

// POST /api/community-recipes/[id]/vote — Vote on a recipe
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
      { error: { code: 'UNAUTHORIZED', message: 'Please sign in to vote', details: null } },
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

  const validation = validateData(voteSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid vote data', details: formatZodErrors(validation.errors) } },
      { status: 400 }
    )
  }

  const { vote } = validation.data

  const response = NextResponse.json({
    success: true,
    recipeId,
    vote,
    userId: user.id,
    message: `Vote "${vote}" registered. Update client-side store.`,
  })

  addRateLimitHeaders(response, rateLimitResult)
  return response
}
