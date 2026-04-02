import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { emailSchema, formatZodErrors } from '@/lib/validation/schemas'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:newsletter' })

const newsletterPostSchema = z.object({
  email: emailSchema,
  first_name: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
  preferences: z.object({
    promotions: z.boolean().optional(),
    new_products: z.boolean().optional(),
    weekly_digest: z.boolean().optional(),
  }).optional(),
})

export const dynamic = 'force-dynamic'

// Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = newsletterPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const { email, first_name, source, preferences } = parsed.data

    const supabase = await createClient()

    // Get IP address from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || null

    // Subscribe using function
    const { data, error } = await supabase
      .rpc('subscribe_to_newsletter', {
        p_email: email,
        p_first_name: first_name || null,
        p_source: source || 'website',
        p_preferences: preferences || { promotions: true, new_products: true, weekly_digest: true },
        p_ip_address: ip
      })

    if (error) {
      log.error('Error subscribing', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    const result = data?.[0]

    return NextResponse.json({
      success: result?.success || false,
      message: result?.message || 'Subscribed successfully'
    })
  } catch (error) {
    log.error('Newsletter subscribe error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const reason = searchParams.get('reason')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .rpc('unsubscribe_from_newsletter', {
        p_email: email,
        p_reason: reason || null
      })

    if (error) {
      log.error('Error unsubscribing', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    const result = data?.[0]

    return NextResponse.json({
      success: result?.success || false,
      message: result?.message || 'Unsubscribed successfully'
    })
  } catch (error) {
    log.error('Newsletter unsubscribe error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get subscription status (for logged in users)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's email from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ subscribed: false })
    }

    // Check subscription status
    const { data: subscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id, status, preferences, created_at')
      .eq('email', profile.email)
      .single()

    if (!subscriber || subscriber.status !== 'active') {
      return NextResponse.json({ subscribed: false })
    }

    return NextResponse.json({
      subscribed: true,
      preferences: subscriber.preferences,
      subscribed_at: subscriber.created_at
    })
  } catch (error) {
    log.error('Newsletter status error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update preferences (for logged in users)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    // Get user's email from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Update preferences
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ preferences, updated_at: new Date().toISOString() })
      .eq('email', profile.email)

    if (error) {
      log.error('Error updating preferences', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Newsletter update error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
