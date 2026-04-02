import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:unsplash' })

export const dynamic = 'force-dynamic'

interface UnsplashImage {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  description: string | null
  user: {
    name: string
    username: string
  }
}

// GET - Search Unsplash images
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('per_page') || '12'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // Get Unsplash settings from database
  const supabaseAdmin = getSupabaseAdmin()
  const { data: settings } = await supabaseAdmin
    .from('store_settings')
    .select('key, value')
    .in('key', ['enable_unsplash', 'unsplash_access_key'])

  const settingsMap: Record<string, string> = {}
  settings?.forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value
  })

  const isEnabled = settingsMap.enable_unsplash === 'true'
  const accessKey = settingsMap.unsplash_access_key

  if (!isEnabled) {
    return NextResponse.json({ error: 'Unsplash integration is disabled' }, { status: 403 })
  }

  if (!accessKey) {
    return NextResponse.json({ error: 'Unsplash access key not configured' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      log.error('Unsplash API error', { error })
      return NextResponse.json({ error: 'Failed to fetch images from Unsplash' }, { status: response.status })
    }

    const data = await response.json()

    // Transform response to simpler format
    const images = data.results.map((img: UnsplashImage) => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.thumb,
      small: img.urls.small,
      alt: img.alt_description || img.description || 'Unsplash image',
      photographer: img.user.name,
      photographerUrl: `https://unsplash.com/@${img.user.username}`,
    }))

    return NextResponse.json({
      images,
      total: data.total,
      totalPages: data.total_pages,
    })
  } catch (error) {
    log.error('Unsplash fetch error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}
