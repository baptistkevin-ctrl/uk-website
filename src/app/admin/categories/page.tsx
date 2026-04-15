'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  GripVertical,
  Upload,
  Link as LinkIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  emoji: string | null
  parent_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  parent?: Category | null
}

interface CategoryFormData {
  name: string
  slug: string
  description: string
  image_url: string
  emoji: string
  parent_id: string
  display_order: number
  is_active: boolean
}

const initialFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  emoji: '',
  parent_id: '',
  display_order: 0,
  is_active: true
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload')
  const [currentPage, setCurrentPage] = useState(1)
  const categoriesPerPage = 50
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeInactive=true')
      const data = await response.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: editingCategory ? prev.slug : generateSlug(value)
      }))
    } else if (name === 'display_order') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Open modal for new category
  const handleAddNew = () => {
    setEditingCategory(null)
    setFormData(initialFormData)
    setShowModal(true)
  }

  // Open modal for editing
  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      emoji: category.emoji || '',
      parent_id: category.parent_id || '',
      display_order: category.display_order,
      is_active: category.is_active
    })
    setShowModal(true)
  }

  // Save category
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        emoji: formData.emoji || null
      }

      if (editingCategory) {
        // Update
        const response = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...payload })
        })

        if (!response.ok) {
          throw new Error('Failed to update category')
        }
      } else {
        // Create
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error('Failed to create category')
        }
      }

      setShowModal(false)
      fetchCategories()
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      setSelectedCategories(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      fetchCategories()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete category')
    } finally {
      setDeleting(null)
    }
  }

  // Toggle single category selection
  const toggleCategorySelection = (id: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Select/deselect all categories on current page
  const toggleSelectAll = () => {
    const pageIds = paginatedCategories.map(c => c.id)
    const allSelected = pageIds.every(id => selectedCategories.has(id))

    if (allSelected) {
      setSelectedCategories(prev => {
        const newSet = new Set(prev)
        pageIds.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      setSelectedCategories(prev => {
        const newSet = new Set(prev)
        pageIds.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  // Bulk delete selected categories
  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedCategories.size} category(ies)? This action cannot be undone.`)) return

    setBulkDeleting(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedCategories) {
      try {
        const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    setSelectedCategories(new Set())
    setBulkDeleting(false)
    fetchCategories()

    alert(`Deleted ${successCount} category(ies)${errorCount > 0 ? `, ${errorCount} failed` : ''}`)
  }

  // Toggle active status
  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          is_active: !category.is_active
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      fetchCategories()
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await response.json()
      setFormData(prev => ({ ...prev, image_url: url }))
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Remove image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Filter categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Pagination calculations
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage)
  const startIndex = (currentPage - 1) * categoriesPerPage
  const endIndex = startIndex + categoriesPerPage
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

  // Check if all on current page are selected
  const isAllPageSelected = paginatedCategories.length > 0 && paginatedCategories.every(c => selectedCategories.has(c.id))

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  // Get parent categories for select (exclude current category and its children)
  const getParentOptions = () => {
    return categories.filter(cat => {
      if (editingCategory) {
        // Don't allow selecting self or children as parent
        return cat.id !== editingCategory.id && cat.parent_id !== editingCategory.id
      }
      return true
    })
  }

  // Build category hierarchy for display
  const getCategoryPath = (category: Category): string => {
    if (category.parent) {
      return `${category.parent.name} → ${category.name}`
    }
    return category.name
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderTree className="h-7 w-7 text-(--brand-primary)" />
            Categories
          </h1>
          <p className="text-(--color-text-muted) mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={handleAddNew} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCategories.size > 0 && (
        <div className="bg-(--brand-dark) rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-(--brand-primary) rounded-lg flex items-center justify-center font-bold">
                {selectedCategories.size}
              </div>
              <span className="font-medium">category(ies) selected</span>
            </div>
            <button
              onClick={() => setSelectedCategories(new Set())}
              className="text-(--color-text-disabled) hover:text-white text-sm font-medium transition-colors"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--color-error) text-white rounded-xl font-medium hover:bg-(--color-error) transition-colors disabled:opacity-50"
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-(--color-border)">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary) cursor-pointer"
                  />
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  Slug
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  Parent
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-(--color-text-muted)">
                    {searchQuery ? 'No categories found matching your search' : 'No categories yet. Add your first category!'}
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category) => (
                  <tr key={category.id} className={`hover:bg-background transition-colors ${selectedCategories.has(category.id) ? 'bg-(--brand-primary-light)' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCategories.has(category.id)}
                        onChange={() => toggleCategorySelection(category.id)}
                        className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary) cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-(--color-text-disabled)">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-sm font-medium">{category.display_order}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover border border-(--color-border)"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-(--color-elevated) flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-(--color-text-disabled)" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {category.emoji && <span className="mr-2">{category.emoji}</span>}
                            {category.name}
                          </p>
                          {category.description && (
                            <p className="text-sm text-(--color-text-muted) truncate max-w-xs">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-(--color-elevated) px-2 py-1 rounded text-(--color-text-secondary)">
                        {category.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {category.parent ? (
                        <span className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary)">
                          <ChevronRight className="h-3 w-3" />
                          {category.parent.name}
                        </span>
                      ) : (
                        <span className="text-sm text-(--color-text-disabled)">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(category)}
                        className="inline-flex items-center"
                      >
                        {category.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-(--brand-primary-light) text-(--brand-primary)">
                            <ToggleRight className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-(--color-elevated) text-(--color-text-secondary)">
                            <ToggleLeft className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-(--color-text-disabled) hover:text-(--brand-primary) hover:bg-(--brand-primary-light) rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={deleting === category.id}
                          className="p-2 text-(--color-text-disabled) hover:text-(--color-error) hover:bg-(--color-error-bg) rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === category.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredCategories.length > 0 && totalPages > 1 && (
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Showing info */}
            <div className="text-sm text-(--color-text-secondary)">
              Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-foreground">{Math.min(endIndex, filteredCategories.length)}</span> of{' '}
              <span className="font-semibold text-foreground">{filteredCategories.length}</span> categories
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border) disabled:hover:bg-(--color-elevated)"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-(--brand-primary) text-white shadow-lg shadow-(--shadow-green)'
                        : page === '...'
                        ? 'bg-transparent text-(--color-text-disabled) cursor-default'
                        : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden text-sm font-medium text-(--color-text-secondary)">
                Page {currentPage} of {totalPages}
              </div>

              {/* Next button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border) disabled:hover:bg-(--color-elevated)"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <p className="text-sm text-(--color-text-muted)">Total Categories</p>
          <p className="text-2xl font-bold text-foreground">{categories.length}</p>
        </div>
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <p className="text-sm text-(--color-text-muted)">Active</p>
          <p className="text-2xl font-bold text-(--brand-primary)">
            {categories.filter(c => c.is_active).length}
          </p>
        </div>
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <p className="text-sm text-(--color-text-muted)">Parent Categories</p>
          <p className="text-2xl font-bold text-foreground">
            {categories.filter(c => !c.parent_id).length}
          </p>
        </div>
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4">
          <p className="text-sm text-(--color-text-muted)">Subcategories</p>
          <p className="text-2xl font-bold text-foreground">
            {categories.filter(c => c.parent_id).length}
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-(--color-surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
              <h2 className="text-xl font-bold text-foreground">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-(--color-text-disabled) hover:text-(--color-text-secondary) hover:bg-(--color-elevated) rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-[1fr,80px] gap-3">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Fresh Produce"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    name="emoji"
                    value={formData.emoji}
                    onChange={handleInputChange}
                    placeholder="🥬"
                    className="mt-1 text-center text-xl"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g., fresh-produce"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-(--color-text-muted) mt-1">URL-friendly identifier (auto-generated from name)</p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) text-sm"
                />
              </div>

              {/* Category Image */}
              <div>
                <Label>Category Image</Label>

                {/* Image Mode Toggle */}
                <div className="flex gap-2 mt-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      imageMode === 'upload'
                        ? 'bg-(--brand-primary) text-white'
                        : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      imageMode === 'url'
                        ? 'bg-(--brand-primary) text-white'
                        : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)'
                    }`}
                  >
                    <LinkIcon className="h-4 w-4" />
                    URL
                  </button>
                </div>

                {/* Image Preview */}
                {formData.image_url && (
                  <div className="relative mb-3 rounded-xl overflow-hidden border border-(--color-border)">
                    <img
                      src={formData.image_url}
                      alt="Category preview"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-(--color-error) text-white rounded-lg hover:bg-(--color-error) transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {imageMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="category-image-upload"
                    />
                    <label
                      htmlFor="category-image-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-(--color-border) rounded-xl cursor-pointer hover:border-(--brand-primary) hover:bg-(--brand-primary-light) transition-colors ${
                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-(--brand-primary) animate-spin mb-2" />
                          <span className="text-sm text-(--color-text-muted)">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-(--color-text-disabled) mb-2" />
                          <span className="text-sm text-(--color-text-muted)">Click to upload image</span>
                          <span className="text-xs text-(--color-text-disabled) mt-1">PNG, JPG up to 5MB</span>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="parent_id">Parent Category</Label>
                <select
                  id="parent_id"
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) text-sm"
                >
                  <option value="">None (Top Level)</option>
                  {getParentOptions().filter(c => !c.parent_id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min={0}
                  className="mt-1"
                />
                <p className="text-xs text-(--color-text-muted) mt-1">Lower numbers appear first</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-(--color-border) text-(--brand-primary) focus:ring-(--brand-primary)"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active (visible on storefront)
                </Label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-(--color-border)">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingCategory ? 'Update' : 'Create'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
