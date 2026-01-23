import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// GET all settings
export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('store_settings')
    .select('*')
    .order('category', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to key-value object
  const settings: Record<string, any> = {}
  data.forEach((setting: any) => {
    settings[setting.key] = setting.value
  })

  return NextResponse.json(settings)
}

// PUT - Update settings (upsert - create if not exists)
export async function PUT(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()

    // Upsert each setting (create if not exists, update if exists)
    for (const [key, value] of Object.entries(body)) {
      const { error } = await supabaseAdmin
        .from('store_settings')
        .upsert(
          {
            key,
            value: String(value),
            category: key.startsWith('enable_') ? 'features' :
                      key.includes('unsplash') ? 'integrations' : 'general'
          },
          { onConflict: 'key' }
        )

      if (error) {
        console.error(`Error upserting ${key}:`, error)
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// POST - Create new setting
export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { key, value, description, category } = body

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .upsert({
        key,
        value,
        description,
        category: category || 'general',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
