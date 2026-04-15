import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

/**
 * POST /api/orders/[id]/delivery-photo
 * Upload a delivery proof photo (admin/vendor use)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if (!auth.success) return auth.error

  const { id: orderId } = await params
  const supabaseAdmin = getSupabaseAdmin()

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images allowed' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const fileName = `delivery-proofs/${orderId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('product-images')
    .upload(fileName, buffer, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('product-images')
    .getPublicUrl(fileName)

  // Update order with delivery photo URL
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      delivery_photo_url: publicUrl,
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
