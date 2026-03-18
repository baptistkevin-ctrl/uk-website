import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// Whitelist of allowed setting keys to prevent arbitrary key injection
const ALLOWED_SETTING_KEYS = [
  'store_name',
  'store_tagline',
  'store_description',
  'store_email',
  'store_phone',
  'store_address',
  'store_currency',
  'store_timezone',
  'enable_reviews',
  'enable_wishlists',
  'enable_compare',
  'enable_loyalty',
  'enable_vendor_marketplace',
  'enable_chatbot',
  'enable_notifications',
  'enable_stock_alerts',
  'enable_price_alerts',
  'enable_returns',
  'enable_coupons',
  'enable_delivery_slots',
  'delivery_fee_pence',
  'free_delivery_threshold_pence',
  'min_order_pence',
  'max_order_items',
  'unsplash_access_key',
  'unsplash_enabled',
  'meta_title',
  'meta_description',
  'social_facebook',
  'social_twitter',
  'social_instagram',
]

// GET all settings
export async function GET() {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

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
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()

    // Upsert each setting (create if not exists, update if exists)
    // Skip keys not in the whitelist to prevent arbitrary setting injection
    const rejectedKeys: string[] = []
    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_SETTING_KEYS.includes(key)) {
        rejectedKeys.push(key)
        continue
      }
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

    return NextResponse.json({
      success: true,
      ...(rejectedKeys.length > 0 && { rejected_keys: rejectedKeys })
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// POST - Create new setting
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { key, value, description, category } = body

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
    }

    if (!ALLOWED_SETTING_KEYS.includes(key)) {
      return NextResponse.json({ error: `Setting key '${key}' is not allowed` }, { status: 400 })
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
