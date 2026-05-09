'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Palette } from 'lucide-react'
import type { Note } from '@/stores/notesStore'
import { useThemeColor } from '@/hooks/useThemeColor'

interface NoteEditorProps {
  note?: Note | null
  isOpen?: boolean
  onClose?: () => void
  onSave?: (data: { title: string; content: string; category?: string; tags?: string[]; color?: string }) => Promise<void>
}

const colorOptions = [
  { name: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { name: 'red', label: 'Red', bg: 'bg-red-500' },
  { name: 'green', label: 'Green', bg: 'bg-green-500' },
  { name: 'yellow', label: 'Yellow', bg: 'bg-yellow-500' },
  { name: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { name: 'pink', label: 'Pink', bg: 'bg-pink-500' },
]

export function NoteEditor({ note, isOpen = false, onClose = () => {}, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [color, setColor] = useState('blue')
  const [isSaving, setIsSaving] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const { primary } = useThemeColor()

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setCategory(note.category || '')
      setTags(note.tags?.join(', ') || '')
      setColor(note.color || 'blue')
    } else {
      resetForm()
    }
  }, [note, isOpen])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setCategory('')
    setTags('')
    setColor('blue')
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required')
      return
    }

    try {
      setIsSaving(true)
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      await onSave?.({
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        color,
      })

      resetForm()
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#16162A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/[0.1]">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#16162A] border-b border-gray-200 dark:border-white/[0.1] p-6 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-black dark:text-white">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0F0F1A] text-black dark:text-white focus:outline-none focus:ring-2 transition-colors"
              style={{ focusRingColor: primary }}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={10}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0F0F1A] text-black dark:text-white focus:outline-none focus:ring-2 transition-colors resize-none"
              style={{ focusRingColor: primary }}
            />
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Personal, Work..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0F0F1A] text-black dark:text-white focus:outline-none focus:ring-2 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., important, later..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0F0F1A] text-black dark:text-white focus:outline-none focus:ring-2 transition-colors"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Palette size={16} />
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`w-full aspect-square rounded-lg ${c.bg} transition-transform ${
                    color === c.name ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  title={c.label}
                  style={color === c.name ? { outlineColor: primary } : {}}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-[#0F0F1A] border-t border-gray-200 dark:border-white/[0.1] p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Note
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
