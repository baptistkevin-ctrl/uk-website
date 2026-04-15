'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  Image as ImageIcon,
  X,
  Save,
  ExternalLink,
} from 'lucide-react'

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  button_text: string | null
  button_link: string | null
  is_active: boolean
  display_order: number
  created_at: string
}

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: '',
    button_link: '',
    is_active: true,
  })

  const fetchSlides = async () => {
    try {
      const res = await fetch('/api/admin/hero-slides')
      const data = await res.json()
      if (Array.isArray(data)) {
        setSlides(data)
      }
    } catch (error) {
      console.error('Error fetching slides:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSlides()
  }, [])

  const openAddModal = () => {
    setEditingSlide(null)
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      button_text: '',
      button_link: '',
      is_active: true,
    })
    setShowModal(true)
  }

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      image_url: slide.image_url,
      button_text: slide.button_text || '',
      button_link: slide.button_link || '',
      is_active: slide.is_active,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.image_url) {
      alert('Title and image URL are required')
      return
    }

    setSaving(true)
    try {
      const method = editingSlide ? 'PUT' : 'POST'
      const body = editingSlide
        ? { id: editingSlide.id, ...formData }
        : formData

      const res = await fetch('/api/admin/hero-slides', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        fetchSlides()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save slide')
      }
    } catch (error) {
      console.error('Error saving slide:', error)
      alert('Failed to save slide')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return

    try {
      const res = await fetch(`/api/admin/hero-slides?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSlides(slides.filter((s) => s.id !== id))
      }
    } catch (error) {
      console.error('Error deleting slide:', error)
    }
  }

  const toggleActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch('/api/admin/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slide.id, is_active: !slide.is_active }),
      })
      if (res.ok) {
        setSlides(
          slides.map((s) =>
            s.id === slide.id ? { ...s, is_active: !s.is_active } : s
          )
        )
      }
    } catch (error) {
      console.error('Error toggling slide:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hero Slides</h1>
          <p className="text-(--color-text-muted) mt-1">Manage homepage banner slides</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-all shadow-lg shadow-(--shadow-green)"
        >
          <Plus className="w-5 h-5" />
          Add Slide
        </button>
      </div>

      {/* Slides Grid */}
      {slides.length === 0 ? (
        <div className="bg-(--color-surface) rounded-2xl p-12 text-center border border-(--color-border)">
          <ImageIcon className="w-16 h-16 text-(--color-text-disabled) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No slides yet</h3>
          <p className="text-(--color-text-muted) mb-6">Create your first hero slide to display on the homepage</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add First Slide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`bg-(--color-surface) rounded-2xl overflow-hidden border ${
                slide.is_active ? 'border-(--brand-primary)/20' : 'border-(--color-border)'
              } shadow-sm hover:shadow-lg transition-all group`}
            >
              {/* Image Preview */}
              <div className="relative h-48 bg-(--color-elevated)">
                <Image
                  src={slide.image_url}
                  alt={slide.title}
                  fill
                  className="object-cover"
                />
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      slide.is_active
                        ? 'bg-(--brand-primary-light) text-(--brand-primary)'
                        : 'bg-(--color-elevated) text-(--color-text-secondary)'
                    }`}
                  >
                    {slide.is_active ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Hidden
                      </>
                    )}
                  </span>
                </div>
                {/* Order Badge */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white">
                    <GripVertical className="w-3 h-3" />
                    #{index + 1}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1 truncate">{slide.title}</h3>
                {slide.subtitle && (
                  <p className="text-sm text-(--color-text-muted) mb-3 line-clamp-2">{slide.subtitle}</p>
                )}
                {slide.button_text && slide.button_link && (
                  <div className="flex items-center gap-1 text-xs text-(--brand-primary) mb-3">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{slide.button_text} → {slide.button_link}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-(--color-border)">
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      slide.is_active
                        ? 'bg-(--brand-amber-soft) text-(--brand-amber) hover:bg-amber-100'
                        : 'bg-(--brand-primary-light) text-(--brand-primary) hover:bg-(--brand-primary-light)'
                    }`}
                  >
                    {slide.is_active ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(slide)}
                    className="p-2 text-(--color-text-muted) hover:text-(--color-info) hover:bg-(--color-info-bg) rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="p-2 text-(--color-text-muted) hover:text-(--color-error) hover:bg-(--color-error-bg) rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-surface) rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
              <h2 className="text-xl font-bold text-foreground">
                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-(--color-text-disabled) hover:text-(--color-text-secondary) rounded-lg hover:bg-(--color-elevated)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Preview */}
              {formData.image_url && (
                <div className="relative h-48 bg-(--color-elevated) rounded-xl overflow-hidden">
                  <Image
                    src={formData.image_url}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  placeholder="e.g., Fresh Groceries Delivered"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  placeholder="e.g., Get 20% off your first order"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                    placeholder="e.g., Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                    placeholder="e.g., /products"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                />
                <label htmlFor="is_active" className="text-sm text-foreground">
                  Show this slide on the homepage
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-(--color-border) bg-background rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-(--color-border) rounded-xl text-foreground font-medium hover:bg-(--color-elevated) transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingSlide ? 'Update Slide' : 'Create Slide'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
