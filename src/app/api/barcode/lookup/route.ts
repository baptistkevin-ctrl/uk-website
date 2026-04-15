import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code || code.trim().length === 0) {
    return NextResponse.json(
      { code: 'MISSING_CODE', message: 'Barcode code is required' },
      { status: 400 }
    )
  }

  // Sanitize: allow only alphanumeric and hyphens, cap length
  const sanitized = code.trim().replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50)

  if (sanitized.length === 0) {
    return NextResponse.json(
      { code: 'INVALID_CODE', message: 'Barcode contains invalid characters' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, price_pence, image_url, barcode, brand, unit, stock_quantity')
      .eq('barcode', sanitized)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: `No product found for barcode: ${sanitized}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ product: data })
  } catch {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Failed to look up barcode' },
      { status: 500 }
    )
  }
}
