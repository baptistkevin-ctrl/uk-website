'use client'

import {
  ImagePlus,
  X,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'

interface BulkUploadResults {
  matched: number
  notFound: string[]
  total: number
}

interface BulkImageUploadModalProps {
  show: boolean
  uploading: boolean
  results: BulkUploadResults | null
  onClose: () => void
  onSelectFiles: () => void
}

export default function BulkImageUploadModal({
  show,
  uploading,
  results,
  onClose,
  onSelectFiles,
}: BulkImageUploadModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <ImagePlus className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bulk Image Upload</h2>
              <p className="text-sm text-slate-500">Match images to products by filename</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Name your image files to match product names</li>
              <li>Example: &quot;Organic Bananas.jpg&quot; matches &quot;Organic Bananas&quot;</li>
              <li>Matching ignores spaces, special characters, and case</li>
              <li>Select multiple images at once</li>
            </ul>
          </div>

          {/* Upload Button */}
          <div className="text-center">
            <button
              onClick={onSelectFiles}
              disabled={uploading}
              className={`inline-flex items-center gap-3 px-6 py-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                  <span className="text-slate-600 font-medium">Uploading images...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400" />
                  <div className="text-left">
                    <span className="text-slate-900 font-semibold block">Click to select images</span>
                    <span className="text-sm text-slate-500">JPG, PNG, GIF, WebP</span>
                  </div>
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700">{results.matched}</p>
                  <p className="text-sm text-emerald-600">Matched & Uploaded</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">{results.notFound.length}</p>
                  <p className="text-sm text-red-600">Not Matched</p>
                </div>
              </div>

              {/* Not found list */}
              {results.notFound.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Files not matched:</h4>
                  <ul className="text-sm text-slate-600 space-y-1 max-h-40 overflow-y-auto">
                    {results.notFound.map((filename, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        {filename}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
