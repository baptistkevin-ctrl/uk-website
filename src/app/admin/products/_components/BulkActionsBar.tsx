'use client'

import { Trash2, Loader2 } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  bulkDeleting: boolean
  onClearSelection: () => void
  onBulkDelete: () => void
}

export default function BulkActionsBar({
  selectedCount,
  bulkDeleting,
  onClearSelection,
  onBulkDelete,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-slate-900 rounded-2xl p-4 shadow-lg flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold">
            {selectedCount}
          </div>
          <span className="font-medium">product{selectedCount > 1 ? 's' : ''} selected</span>
        </div>
        <button
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          Clear selection
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onBulkDelete}
          disabled={bulkDeleting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
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
  )
}
