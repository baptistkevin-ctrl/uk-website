import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const limit = parseInt(searchParams.get('limit') || '12')
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'popular'
  const city = searchParams.get('city') || ''
  const verified = searchParams.get('verified') === 'true'
  const userLat = parseFloat(searchParams.get('lat') || '')
  const userLng = parseFloat(searchParams.get('lng') || '')
  const hasGeo = !isNaN(userLat) && !isNaN(userLng)

  const supabase = await createClient()
  const offset = (page - 1) * limit

  try {
    // If sorting by nearest and we have user coordinates, use RPC for distance calc
    if (sort === 'nearest' && hasGeo) {
      const supabaseAdmin = getSupabaseAdmin()

      // Build filters for the raw query
      const conditions: string[] = ["status = 'approved'"]
      const params: unknown[] = [userLat, userLng, limit, offset]

      if (search) {
        conditions.push(`(business_name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`)
        params.push(`%${search}%`)
      }
      if (city) {
        conditions.push(`city = $${params.length + 1}`)
        params.push(city)
      }
      if (verified) {
        conditions.push('is_verified = true')
      }

      const whereClause = conditions.join(' AND ')

      // Get total count
      const { data: countResult } = await supabaseAdmin.rpc('exec_sql', {
        query: `SELECT COUNT(*) as total FROM vendors WHERE ${whereClause}`
      }).maybeSingle()

      // Use haversine_distance for sorting, fallback nulls to huge distance
      const { data: nearestVendors, error: nearError } = await supabaseAdmin
        .from('vendors')
        .select(`
          id,
          business_name,
          slug,
          description,
          logo_url,
          banner_url,
          city,
          postcode,
          latitude,
          longitude,
          rating,
          review_count,
          is_verified,
          created_at
        `, { count: 'exact' })
        .eq('status', 'approved')
        .then(async () => {
          // Supabase JS can't do computed ORDER BY, so fetch all and sort in-app
          let q = supabaseAdmin
            .from('vendors')
            .select(`
              id, business_name, slug, description, logo_url, banner_url,
              city, postcode, latitude, longitude, rating, review_count,
              is_verified, created_at
            `, { count: 'exact' })
            .eq('status', 'approved')

          if (search) q = q.or(`business_name.ilike.%${search}%,description.ilike.%${search}%`)
          if (city) q = q.eq('city', city)
          if (verified) q = q.eq('is_verified', true)

          return q
        })

      // Fallback: fetch all matching vendors and sort by distance in JS
      let allQuery = supabaseAdmin
        .from('vendors')
        .select(`
          id, business_name, slug, description, logo_url, banner_url,
          city, postcode, latitude, longitude, rating, review_count,
          is_verified, created_at
        `, { count: 'exact' })
        .eq('status', 'approved')

      if (search) allQuery = allQuery.or(`business_name.ilike.%${search}%,description.ilike.%${search}%`)
      if (city) allQuery = allQuery.eq('city', city)
      if (verified) allQuery = allQuery.eq('is_verified', true)

      const { data: allVendors, count: totalCount, error } = await allQuery

      if (error) {
        console.error('Error fetching stores for nearest sort:', error)
        return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
      }

      // Calculate distances and sort
      const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2
        return R * 2 * Math.asin(Math.sqrt(a))
      }

      const vendorsWithDistance = (allVendors || []).map(v => ({
        ...v,
        distance_km: v.latitude && v.longitude
          ? Math.round(haversine(userLat, userLng, v.latitude, v.longitude) * 10) / 10
          : null
      }))

      // Sort: vendors with coordinates first (by distance), then without
      vendorsWithDistance.sort((a, b) => {
        if (a.distance_km !== null && b.distance_km !== null) return a.distance_km - b.distance_km
        if (a.distance_km !== null) return -1
        if (b.distance_km !== null) return 1
        return 0
      })

      // Paginate
      const paginatedVendors = vendorsWithDistance.slice(offset, offset + limit)

      // Get product counts
      const vendorIds = paginatedVendors.map(v => v.id)
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

      const vendorsWithCounts = paginatedVendors.map(v => ({
        ...v,
        product_count: productCounts[v.id] || 0
      }))

      // Get cities for filter
      const { data: citiesData } = await supabase
        .from('vendors')
        .select('city')
        .eq('status', 'approved')
        .not('city', 'is', null)
      const uniqueCities = [...new Set(citiesData?.map(c => c.city).filter(Boolean))]

      return NextResponse.json({
        stores: vendorsWithCounts,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        },
        filters: { cities: uniqueCities.sort() }
      })
    }

    // Standard query (non-geo sorts)
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
        postcode,
        latitude,
        longitude,
        rating,
        review_count,
        is_verified,
        created_at
      `, { count: 'exact' })
      .eq('status', 'approved')

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (city) {
      query = query.eq('city', city)
    }
    if (verified) {
      query = query.eq('is_verified', true)
    }

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

    query = query.range(offset, offset + limit - 1)

    const { data: vendors, count, error } = await query

    if (error) {
      console.error('Error fetching stores:', error)
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
    }

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

    // Add product count + distance if user has geo
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2
      return R * 2 * Math.asin(Math.sqrt(a))
    }

    const vendorsWithCounts = vendors?.map(vendor => ({
      ...vendor,
      product_count: productCounts[vendor.id] || 0,
      distance_km: hasGeo && vendor.latitude && vendor.longitude
        ? Math.round(haversine(userLat, userLng, vendor.latitude, vendor.longitude) * 10) / 10
        : null
    })) || []

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
      filters: { cities: uniqueCities.sort() }
    })
  } catch (error) {
    console.error('Stores API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
