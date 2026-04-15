import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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

// GET /api/community-recipes/[id] — Get single recipe
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Recipe ID is required', details: null } },
      { status: 400 }
    )
  }

  // The client store is the primary data source.
  // This endpoint returns the ID for the client to look up locally.
  return NextResponse.json({
    success: true,
    recipeId: id,
    message: 'Look up recipe in client-side store by ID.',
  })
}

// DELETE /api/community-recipes/[id] — Delete recipe (author only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Recipe ID is required', details: null } },
      { status: 400 }
    )
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Please sign in to delete a recipe', details: null } },
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

  // The client will verify ownership via authorId === user.id before calling this.
  // This endpoint confirms auth and returns success for the client to remove from store.
  return NextResponse.json({
    success: true,
    recipeId: id,
    userId: user.id,
    message: 'Authorized to delete. Remove from client-side store.',
  })
}
