'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, Search, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface UnsplashImage {
  id: string
  url: string
  thumb: string
  small: string
  alt: string
  photographer: string
  photographerUrl: string
}

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export default function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Unsplash state
  const [showUnsplash, setShowUnsplash] = useState(false)
  const [unsplashEnabled, setUnsplashEnabled] = useState(false)
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([])
  const [unsplashLoading, setUnsplashLoading] = useState(false)
  const [unsplashError, setUnsplashError] = useState('')

  // Check if Unsplash is enabled
  useEffect(() => {
    const checkUnsplash = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          setUnsplashEnabled(data.enable_unsplash === true || data.enable_unsplash === 'true')
        }
      } catch {
        // Ignore error
      }
    }
    checkUnsplash()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    const newImages: string[] = []

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Upload failed')
        }

        const data = await res.json()
        newImages.push(data.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
    }

    onChange([...images, ...newImages])
    setUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  // Search Unsplash images
  const searchUnsplash = async () => {
    if (!unsplashQuery.trim()) return

    setUnsplashLoading(true)
    setUnsplashError('')
    setUnsplashImages([])

    try {
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(unsplashQuery)}`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Search failed')
      }

      const data = await res.json()
      setUnsplashImages(data.images)
    } catch (err) {
      setUnsplashError(err instanceof Error ? err.message : 'Search failed')
    }

    setUnsplashLoading(false)
  }

  // Select Unsplash image
  const selectUnsplashImage = (img: UnsplashImage) => {
    if (images.length >= maxImages) {
      setUnsplashError(`Maximum ${maxImages} images allowed`)
      return
    }
    onChange([...images, img.url])
    setShowUnsplash(false)
    setUnsplashQuery('')
    setUnsplashImages([])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <div className="flex gap-2">
            {/* Upload button */}
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-gray-50 transition-colors">
              {uploading ? (
                <Loader2 size={24} className="text-gray-400 animate-spin" />
              ) : (
                <>
                  <Upload size={24} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Upload</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple={maxImages > 1}
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {/* Unsplash button */}
            {unsplashEnabled && (
              <button
                type="button"
                onClick={() => setShowUnsplash(true)}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <ImageIcon size={24} className="text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Unsplash</span>
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <p className="text-gray-500 text-xs">
        Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB per image.
        {unsplashEnabled && ' Or search free images from Unsplash.'}
      </p>

      {/* Unsplash Search Modal */}
      {showUnsplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Search Unsplash</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUnsplash(false)
                  setUnsplashQuery('')
                  setUnsplashImages([])
                  setUnsplashError('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={unsplashQuery}
                    onChange={(e) => setUnsplashQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                    placeholder="Search for images... (e.g., fruits, vegetables, groceries)"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={searchUnsplash}
                  disabled={unsplashLoading || !unsplashQuery.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {unsplashLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              {unsplashError && (
                <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{unsplashError}</div>
              )}

              {unsplashLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}

              {!unsplashLoading && unsplashImages.length === 0 && !unsplashError && (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Search for images to get started</p>
                </div>
              )}

              {unsplashImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {unsplashImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => selectUnsplashImage(img)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.thumb}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 bg-black/60 px-2 py-1 rounded">
                          Select
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">
                Photos provided by{' '}
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Unsplash
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
