import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/verify'
import { logFileUpload, sanitizeFilename } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Verify user authentication
  const auth = await requireAuth(request)
  if (!auth.success) return auth.error

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
      { status: 400 }
    )
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5MB.' },
      { status: 400 }
    )
  }

  // Sanitize filename to prevent path traversal
  const sanitizedOriginalName = sanitizeFilename(file.name)
  const fileExt = sanitizedOriginalName.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `products/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.storage
    .from('product-images')
    .upload(filePath, buffer, {
      contentType: file.type,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('product-images').getPublicUrl(filePath)

  // Log file upload for audit trail
  if (auth.user) {
    await logFileUpload(
      request,
      { id: auth.user.id, email: auth.user.email || '', role: auth.profile?.role || 'user' },
      sanitizedOriginalName,
      file.size,
      file.type,
      filePath
    )
  }

  return NextResponse.json({ url: publicUrl })
}
