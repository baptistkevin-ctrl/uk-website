'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found')
        return res.json()
      })
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <p className="text-(--color-error) mb-4">{error || 'Product not found'}</p>
        <button
          onClick={() => router.push('/admin/products')}
          className="text-(--brand-primary) hover:underline"
        >
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-(--color-text-secondary) hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Edit Product</h1>
      <ProductForm product={product} isEditing />
    </div>
  )
}
