import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

// Profile type for user profiles
export interface UserProfile {
  id: string
  email: string
  role: string
  full_name?: string
}

// Types for auth responses
export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email?: string | null
  }
  profile?: UserProfile
  error?: NextResponse
}

/**
 * Verify that a request is authenticated
 * Returns user info or an error response
 */
export async function requireAuth(request?: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        )
      }
    }

    // Get user profile with role — use admin client to bypass RLS
    const adminClient = getSupabaseAdmin()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single()

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        id: user.id,
        email: profile?.email || user.email || '',
        role: profile?.role || 'customer',
        full_name: profile?.full_name
      }
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

/**
 * Verify that a request is from an admin user
 */
export async function requireAdmin(request?: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult
  }

  if (!['admin', 'super_admin'].includes(authResult.profile!.role)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
  }

  return authResult
}

/**
 * Verify that a request is from a super admin user
 */
export async function requireSuperAdmin(request?: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult
  }

  if (authResult.profile!.role !== 'super_admin') {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }
  }

  return authResult
}

/**
 * Verify that a request is from a vendor
 */
export async function requireVendor(request?: NextRequest): Promise<AuthResult & { vendorId?: string }> {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult
  }

  // Check if user is a vendor
  const supabase = await createClient()
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', authResult.user!.id)
    .eq('status', 'approved')
    .single()

  if (!vendor) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Forbidden - Vendor access required' },
        { status: 403 }
      )
    }
  }

  return {
    ...authResult,
    vendorId: vendor.id
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(roles: string[]): Promise<boolean> {
  const authResult = await requireAuth()
  return authResult.success && roles.includes(authResult.profile!.role)
}

/**
 * Get IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return '127.0.0.1'
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Unknown'
}
