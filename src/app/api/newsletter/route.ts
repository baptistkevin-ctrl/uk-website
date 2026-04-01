import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, first_name, source, preferences } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

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
      console.error('Error subscribing:', error)
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    const result = data?.[0]

    return NextResponse.json({
      success: result?.success || false,
      message: result?.message || 'Subscribed successfully'
    })
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
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
      console.error('Error unsubscribing:', error)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    const result = data?.[0]

    return NextResponse.json({
      success: result?.success || false,
      message: result?.message || 'Unsubscribed successfully'
    })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
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
    console.error('Newsletter status error:', error)
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
      console.error('Error updating preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
