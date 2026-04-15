import ProductForm from '@/components/admin/ProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Add Product - Admin',
}

export default function AddProductPage() {
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
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Add New Product</h1>
      <ProductForm />
    </div>
  )
}
