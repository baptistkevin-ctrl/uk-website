import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/'
  const referralCode = searchParams.get('ref') || null

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if profile exists, create if not (for social login first-timers)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Profile should be auto-created by DB trigger (handle_new_user).
          // If missing (race condition), create it as fallback.
          const { createClient } = await import('@supabase/supabase-js')
          const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          await admin.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || null,
          }, { onConflict: 'id' })

          // Award signup loyalty bonus for new users
          try {
            const { awardPoints } = await import('@/lib/automation/loyalty-points')
            await awardPoints(user.id, 'signup', 100, undefined, undefined, 'Welcome bonus - new account')
          } catch {
            // Non-critical - don't block registration
          }

          // Process referral code if provided
          if (referralCode) {
            try {
              await admin.rpc('apply_referral_code', {
                p_referral_code: referralCode,
                p_referred_user_id: user.id,
              })
            } catch {
              // Non-critical - referral processing can be retried
            }
          }
        }
      }

      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  // Auth code exchange failed - redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}
