import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { checkCsrf } from '@/lib/security/csrf'
import { sanitizeText } from '@/lib/security'

export const dynamic = 'force-dynamic'

const SUBSTITUTION_PREFS = ['accept_similar', 'contact_me', 'remove_item'] as const
type SubstitutionPref = (typeof SUBSTITUTION_PREFS)[number]

interface ItemPreferenceRow {
  id: string
  order_id: string
  product_id: string
  product_name: string
  note: string
  substitution_pref: SubstitutionPref
  created_at: string
  updated_at: string
}

interface ItemPreferenceResponse {
  productId: string
  productName: string
  note: string
  substitutionPref: SubstitutionPref
}

function formatPreference(row: ItemPreferenceRow): ItemPreferenceResponse {
  return {
    productId: row.product_id,
    productName: row.product_name,
    note: row.note,
    substitutionPref: row.substitution_pref,
  }
}

function isTableMissing(error: { code?: string; message?: string }): boolean {
  const msg = error.message || ''
  return (
    error.code === '42P01' ||
    (msg.includes('relation') && msg.includes('does not exist'))
  )
}

// GET /api/picker-chat/preferences?orderId=XXX - Get item-level picking preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify order belongs to user (or user is picker/admin)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isPrivileged = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'picker'
      if (!isPrivileged) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Fetch item preferences
    const { data: preferences, error: prefError } = await supabaseAdmin
      .from('picker_item_preferences')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (prefError && isTableMissing(prefError)) {
      return NextResponse.json({ preferences: [], generalNote: '' })
    }

    if (prefError) {
      console.error('Picker preferences query error:', prefError)
      return NextResponse.json({ preferences: [], generalNote: '' })
    }

    // Fetch general note from order metadata or a dedicated column
    const { data: orderMeta } = await supabaseAdmin
      .from('picker_order_notes')
      .select('general_note')
      .eq('order_id', orderId)
      .maybeSingle()

    return NextResponse.json({
      preferences: (preferences || []).map(formatPreference),
      generalNote: orderMeta?.general_note || '',
    })
  } catch (error) {
    console.error('Picker preferences GET error:', error)
    return NextResponse.json({ preferences: [], generalNote: '' })
  }
}

// PUT /api/picker-chat/preferences - Set preferences for items in an order
export async function PUT(request: NextRequest) {
  try {
    // CSRF validation
    const csrfResult = await checkCsrf(request)
    if (!csrfResult.valid) {
      return csrfResult.error!
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, preferences, generalNote } = body

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    if (!Array.isArray(preferences)) {
      return NextResponse.json({ error: 'preferences must be an array' }, { status: 400 })
    }

    // Validate each preference
    for (const pref of preferences) {
      if (!pref.productId || typeof pref.productId !== 'string') {
        return NextResponse.json({ error: 'Each preference must have a productId' }, { status: 400 })
      }
      if (!pref.productName || typeof pref.productName !== 'string') {
        return NextResponse.json({ error: 'Each preference must have a productName' }, { status: 400 })
      }
      if (typeof pref.note !== 'string' || pref.note.length > 500) {
        return NextResponse.json({ error: 'Note must be a string under 500 characters' }, { status: 400 })
      }
      if (!SUBSTITUTION_PREFS.includes(pref.substitutionPref)) {
        return NextResponse.json({ error: `Invalid substitutionPref: ${pref.substitutionPref}` }, { status: 400 })
      }
    }

    if (generalNote !== undefined && typeof generalNote !== 'string') {
      return NextResponse.json({ error: 'generalNote must be a string' }, { status: 400 })
    }

    if (generalNote && generalNote.length > 1000) {
      return NextResponse.json({ error: 'generalNote must be under 1000 characters' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify order ownership
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Upsert item preferences
    const now = new Date().toISOString()
    const rows = preferences.map((pref: { productId: string; productName: string; note: string; substitutionPref: SubstitutionPref }) => ({
      order_id: orderId,
      user_id: user.id,
      product_id: pref.productId,
      product_name: sanitizeText(pref.productName),
      note: sanitizeText(pref.note),
      substitution_pref: pref.substitutionPref,
      updated_at: now,
    }))

    // Delete existing preferences for this order, then insert fresh
    const { error: deleteError } = await supabaseAdmin
      .from('picker_item_preferences')
      .delete()
      .eq('order_id', orderId)

    if (deleteError && !isTableMissing(deleteError)) {
      console.error('Picker preferences delete error:', deleteError)
    }

    let savedPreferences: ItemPreferenceResponse[] = []

    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('picker_item_preferences')
        .insert(rows)
        .select()

      if (insertError) {
        if (isTableMissing(insertError)) {
          // Return the preferences as-is since table doesn't exist yet
          savedPreferences = preferences.map((pref: { productId: string; productName: string; note: string; substitutionPref: SubstitutionPref }) => ({
            productId: pref.productId,
            productName: pref.productName,
            note: pref.note,
            substitutionPref: pref.substitutionPref,
          }))
        } else {
          console.error('Picker preferences insert error:', insertError)
          return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
        }
      } else {
        savedPreferences = (inserted || []).map(formatPreference)
      }
    }

    // Save general note
    const sanitizedNote = generalNote ? sanitizeText(generalNote) : ''

    const { error: noteError } = await supabaseAdmin
      .from('picker_order_notes')
      .upsert(
        {
          order_id: orderId,
          user_id: user.id,
          general_note: sanitizedNote,
          updated_at: now,
        },
        { onConflict: 'order_id' }
      )

    if (noteError && !isTableMissing(noteError)) {
      console.error('Picker general note save error:', noteError)
    }

    return NextResponse.json({
      preferences: savedPreferences,
      generalNote: sanitizedNote,
    })
  } catch (error) {
    console.error('Picker preferences PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
