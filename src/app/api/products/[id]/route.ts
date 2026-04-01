import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { productService } from '@/services/product.service'
import { handleApiError, apiSuccess, apiCatchAll } from '@/lib/utils/api-error'
import { cacheInvalidateTag } from '@/lib/cache'

export const dynamic = 'force-dynamic'

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await productService.getById(id)
    if (!result.ok) return handleApiError(result)
    return apiSuccess(result.data)
  } catch (error) {
    return apiCatchAll(error, 'products:get')
  }
}

// PUT update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) {
      return auth.error ?? apiCatchAll(new Error('Unauthorized'), 'products:update')
    }

    const { id } = await params
    const body = await request.json()

    const result = await productService.update(id, body)
    if (!result.ok) return handleApiError(result)

    await cacheInvalidateTag('products')
    return apiSuccess(result.data)
  } catch (error) {
    return apiCatchAll(error, 'products:update')
  }
}

// DELETE product (admin only, soft-delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) {
      return auth.error ?? apiCatchAll(new Error('Unauthorized'), 'products:delete')
    }

    const { id } = await params

    const result = await productService.softDelete(id)
    if (!result.ok) return handleApiError(result)

    await cacheInvalidateTag('products')
    return apiSuccess(result.data)
  } catch (error) {
    return apiCatchAll(error, 'products:delete')
  }
}
