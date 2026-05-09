'use client'

import { useState } from 'react'
import { Trash2, Loader2, Pin, Edit2, MoreVertical } from 'lucide-react'
import type { Note } from '@/stores/notesStore'
import { useThemeColor } from '@/hooks/useThemeColor'

interface NoteCardProps {
  note: Note
  onEdit?: (note: Note) => void
  onDelete?: (id: string) => void
  onTogglePin?: (id: string, pinned: boolean) => void
  isSelected?: boolean
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-l-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  red: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-l-red-500', text: 'text-red-600 dark:text-red-400' },
  green: { bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-l-green-500', text: 'text-green-600 dark:text-green-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-l-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-l-purple-500', text: 'text-purple-600 dark:text-purple-400' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-l-pink-500', text: 'text-pink-600 dark:text-pink-400' },
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  isSelected = false,
}: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingPin, setIsTogglingPin] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { primary } = useThemeColor()

  const colors = colorMap[note.color || 'blue'] || colorMap.blue

  const handleDelete = async () => {
    if (confirm('Delete this note?')) {
      try {
        setIsDeleting(true)
        onDelete?.(note.id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleTogglePin = async () => {
    try {
      setIsTogglingPin(true)
      onTogglePin?.(note.id, !note.pinned)
    } finally {
      setIsTogglingPin(false)
    }
  }

  const preview = note.content.substring(0, 100).replace(/\n/g, ' ')

  return (
    <div
      className={`group relative rounded-lg border-l-4 p-4 transition-all ${colors.bg} ${colors.border} ${
        isSelected ? 'ring-2 ring-offset-2' : ''
      } hover:shadow-md dark:hover:shadow-xl`}
      style={isSelected ? { outlineColor: primary, outlineWidth: '2px' } : {}}
    >
      {/* Pinned Badge */}
      {note.pinned && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1.5 shadow-sm">
          <Pin size={12} className="text-white" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 mb-3">
        <h3 className="font-semibold text-sm text-black dark:text-white truncate mb-1">
          {note.title}
        </h3>

        {note.category && (
          <p className={`text-xs ${colors.text} font-medium mb-2`}>
            📁 {note.category}
          </p>
        )}

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
          {preview}
          {note.content.length > 100 ? '...' : ''}
        </p>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="inline-block bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              +{note.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer - Date and Actions */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
        <span>{new Date(note.updated_at).toLocaleDateString('id-ID')}</span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleTogglePin}
            disabled={isTogglingPin}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title={note.pinned ? 'Unpin note' : 'Pin note'}
          >
            {isTogglingPin ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Pin size={12} className={note.pinned ? 'text-yellow-500 fill-yellow-500' : ''} />
            )}
          </button>

          <button
            onClick={() => onEdit?.(note)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Edit note"
          >
            <Edit2 size={12} />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
            title="Delete note"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>
    </div>
  )
}
