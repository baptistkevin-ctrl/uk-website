import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Categories',
  description: 'Browse our product categories',
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  // Fetch top-level categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('display_order')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
        <p className="text-gray-600">Browse our wide selection of grocery categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group block p-6 bg-white rounded-lg border hover:border-green-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-700">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-gray-500 mt-1 text-sm line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No categories available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
