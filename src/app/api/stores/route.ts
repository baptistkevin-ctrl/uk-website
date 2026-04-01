import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchQuery } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'popular'
  const city = searchParams.get('city') || ''
  const verified = searchParams.get('verified') === 'true'

  const supabase = await createClient()
  const offset = (page - 1) * limit

  try {
    // Build query for approved vendors
    let query = supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        slug,
        description,
        logo_url,
        banner_url,
        city,
        rating,
        review_count,
        is_verified,
        created_at
      `, { count: 'exact' })
      .eq('status', 'approved')

    // Apply search filter
    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search)
      if (sanitizedSearch) {
        query = query.or(`business_name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`)
      }
    }

    // Apply city filter
    if (city) {
      query = query.eq('city', city)
    }

    // Apply verified filter
    if (verified) {
      query = query.eq('is_verified', true)
    }

    // Apply sorting
    switch (sort) {
      case 'rating':
        query = query.order('rating', { ascending: false, nullsFirst: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'name':
        query = query.order('business_name', { ascending: true })
        break
      case 'popular':
      default:
        query = query.order('review_count', { ascending: false, nullsFirst: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: vendors, count, error } = await query

    if (error) {
      console.error('Error fetching stores:', error)
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
    }

    // Get product counts for each vendor
    const vendorIds = vendors?.map(v => v.id) || []
    const productCounts: Record<string, number> = {}

    if (vendorIds.length > 0) {
      const { data: counts } = await supabase
        .from('products')
        .select('vendor_id')
        .in('vendor_id', vendorIds)
        .eq('is_active', true)

      if (counts) {
        counts.forEach(p => {
          productCounts[p.vendor_id] = (productCounts[p.vendor_id] || 0) + 1
        })
      }
    }

    // Add product count to each vendor
    const vendorsWithCounts = vendors?.map(vendor => ({
      ...vendor,
      product_count: productCounts[vendor.id] || 0
    })) || []

    // Get distinct cities for filters
    const { data: cities } = await supabase
      .from('vendors')
      .select('city')
      .eq('status', 'approved')
      .not('city', 'is', null)

    const uniqueCities = [...new Set(cities?.map(c => c.city).filter(Boolean))]

    return NextResponse.json({
      stores: vendorsWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        cities: uniqueCities.sort()
      }
    })
  } catch (error) {
    console.error('Stores API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
