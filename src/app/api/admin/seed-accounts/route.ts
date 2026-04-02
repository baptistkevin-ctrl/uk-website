import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:seed-accounts' })

export const dynamic = 'force-dynamic'

// Password from env var only - never hardcoded
const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD

const TEST_ACCOUNTS = [
  {
    email: 'customer@ukgrocery.test',
    full_name: 'Test Customer',
    role: 'customer',
  },
  {
    email: 'admin@ukgrocery.test',
    full_name: 'Test Admin',
    role: 'admin',
  },
  {
    email: 'superadmin@ukgrocery.test',
    full_name: 'Test Super Admin',
    role: 'super_admin',
  },
  {
    email: 'vendor@ukgrocery.test',
    full_name: 'Test Vendor',
    role: 'vendor',
  },
]

export async function POST(request: NextRequest) {
  // Block in production (Vercel sets VERCEL_ENV)
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV
  if (env === 'production') {
    return NextResponse.json({ error: 'Seed accounts disabled in production' }, { status: 403 })
  }

  // Require SEED_TEST_PASSWORD env var to be set
  if (!TEST_PASSWORD) {
    return NextResponse.json({ error: 'SEED_TEST_PASSWORD env var not configured' }, { status: 403 })
  }

  // Require authorization header with CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const expected = `Bearer ${cronSecret}`
  const isValid = authHeader.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Fix the profiles role CHECK constraint to include super_admin
  // The original migration only allows: customer, vendor, admin
  try {
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
          CHECK (role IN ('customer', 'vendor', 'admin', 'super_admin'));
      `
    })
    console.log('Updated profiles role constraint to include super_admin')
  } catch {
    // If rpc doesn't exist, try raw SQL via REST
    // This is a fallback — the constraint fix may need to be run manually
    console.log('Note: Could not auto-fix role constraint via RPC. Will attempt direct upsert.')
  }

  const results: Array<{
    email: string
    role: string
    status: 'created' | 'already_exists' | 'error'
    message: string
  }> = []

  for (const account of TEST_ACCOUNTS) {
    try {
      // Check if user already exists by listing users with this email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === account.email)

      if (existingUser) {
        // Make sure profile has correct role
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email: account.email,
            full_name: account.full_name,
            role: account.role,
          }, { onConflict: 'id' })

        if (profileError) {
          log.error('Profile upsert error for ${account.email}', { error: profileError instanceof Error ? profileError.message : String(profileError) })
        }

        // If vendor, ensure vendor record exists
        if (account.role === 'vendor') {
          await ensureVendorRecord(supabaseAdmin, existingUser.id, account.email)
        }

        results.push({
          email: account.email,
          role: account.role,
          status: 'already_exists',
          message: `Account exists, role updated to ${account.role}`,
        })
        continue
      }

      // Create the user via Supabase Auth Admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: TEST_PASSWORD,
        email_confirm: true, // skip email verification
        user_metadata: {
          full_name: account.full_name,
        },
      })

      if (createError) {
        results.push({
          email: account.email,
          role: account.role,
          status: 'error',
          message: createError.message,
        })
        continue
      }

      // Update profile with correct role
      // The trigger may have created a profile already, so upsert
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          email: account.email,
          full_name: account.full_name,
          role: account.role,
        }, { onConflict: 'id' })

      // If vendor, create vendor record
      if (account.role === 'vendor') {
        await ensureVendorRecord(supabaseAdmin, newUser.user.id, account.email)
      }

      results.push({
        email: account.email,
        role: account.role,
        status: 'created',
        message: 'Account created successfully',
      })
    } catch (error) {
      results.push({
        email: account.email,
        role: account.role,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({
    success: true,
    accounts: results,
  })
}

async function ensureVendorRecord(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  email: string
) {
  const { data: existingVendor } = await supabaseAdmin
    .from('vendors')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!existingVendor) {
    const { error: vendorError } = await supabaseAdmin.from('vendors').insert({
      user_id: userId,
      business_name: 'Test Vendor Store',
      slug: 'test-vendor-store',
      description: 'A test vendor store for development',
      email: email,
      phone: '+44 7700 900000',
      status: 'approved',
      commission_rate: 12.5,
      address_line_1: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
    })
    if (vendorError) {
      log.error('Failed to create vendor record', { error: vendorError instanceof Error ? vendorError.message : String(vendorError) })
    }
  }
}
