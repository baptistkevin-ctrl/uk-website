import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/verify'
import { logFileUpload, sanitizeFilename } from '@/lib/security'
import crypto from 'crypto'

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
  const fileExt = (sanitizedOriginalName.split('.').pop() || 'jpg').toLowerCase()

  // Whitelist allowed extensions
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowedExtensions.includes(fileExt)) {
    return NextResponse.json(
      { error: 'Invalid file extension. Only jpg, jpeg, png, webp, and gif are allowed.' },
      { status: 400 }
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // Verify magic bytes match declared MIME type
  if (!verifyMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: 'File content does not match declared type' },
      { status: 400 }
    )
  }

  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
  const filePath = `products/${fileName}`

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.storage
    .from('product-images')
    .upload(filePath, buffer, {
      contentType: file.type,
    })

  if (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
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

function verifyMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  if (buffer.length < 4) return false

  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  }

  const expected = signatures[mimeType]
  if (!expected) return false

  return expected.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  )
}
