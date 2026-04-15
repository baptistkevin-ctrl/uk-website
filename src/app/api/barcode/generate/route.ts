import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Calculate the EAN-13 check digit for a 12-digit string.
 */
function calculateCheckDigit(digits: string): number {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10)
    sum += digit * (i % 2 === 0 ? 1 : 3)
  }
  return (10 - (sum % 10)) % 10
}

/**
 * Generate a deterministic hash from a string, returning a numeric string
 * of the specified length.
 */
function hashToDigits(input: string, length: number): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0
  }

  // Use absolute value, convert to string, pad/truncate
  const absHash = Math.abs(hash).toString()
  let digits = absHash

  // Extend with secondary hash if needed
  while (digits.length < length) {
    hash = ((hash << 7) - hash + 31) | 0
    digits += Math.abs(hash).toString()
  }

  return digits.slice(0, length)
}

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get('prefix') || '500'
  const productId = request.nextUrl.searchParams.get('productId')

  if (!productId || productId.trim().length === 0) {
    return NextResponse.json(
      { code: 'MISSING_PRODUCT_ID', message: 'productId is required' },
      { status: 400 }
    )
  }

  // Validate prefix is numeric and 3 digits
  const sanitizedPrefix = prefix.replace(/\D/g, '').slice(0, 3).padStart(3, '0')

  // Generate remaining 9 digits from product ID hash
  const remainingDigits = hashToDigits(productId.trim(), 9)

  // Build 12-digit base (prefix + 9 hashed digits)
  const base12 = sanitizedPrefix + remainingDigits

  // Calculate check digit to form complete EAN-13
  const checkDigit = calculateCheckDigit(base12)
  const ean13 = base12 + checkDigit.toString()

  // Verify uniqueness against existing barcodes
  const supabase = getSupabaseAdmin()

  try {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('barcode', ean13)
      .single()

    if (existing) {
      // Collision detected — append timestamp bits to differentiate
      const timestamp = Date.now().toString().slice(-6)
      const altBase = sanitizedPrefix + hashToDigits(productId + timestamp, 9)
      const altCheck = calculateCheckDigit(altBase)
      const altEan13 = altBase + altCheck.toString()

      return NextResponse.json({
        barcode: altEan13,
        format: 'EAN-13',
        prefix: sanitizedPrefix,
        collision_resolved: true,
      })
    }

    return NextResponse.json({
      barcode: ean13,
      format: 'EAN-13',
      prefix: sanitizedPrefix,
      collision_resolved: false,
    })
  } catch {
    // If DB check fails, still return the generated barcode
    return NextResponse.json({
      barcode: ean13,
      format: 'EAN-13',
      prefix: sanitizedPrefix,
      collision_resolved: false,
    })
  }
}
