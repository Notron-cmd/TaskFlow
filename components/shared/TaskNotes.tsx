'use client'

import { useState } from 'react'
import { Trash2, Loader2, Edit2, Check, X } from 'lucide-react'
import { createNote, deleteNote, updateNote, type TaskNote } from '@/lib/actions/task-notes'
import { toast } from '@/hooks/use-toast'
import { useThemeColor } from '@/hooks/useThemeColor'

interface TaskNotesProps {
  taskId: string
  notes: TaskNote[]
  currentUserId: string
  onNoteAdded?: () => void
  onNoteDeleted?: () => void
  onNoteUpdated?: () => void
}

export function TaskNotes({
  taskId,
  notes,
  currentUserId,
  onNoteAdded,
  onNoteDeleted,
  onNoteUpdated,
}: TaskNotesProps) {
  const { primary } = useThemeColor()
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    try {
      setIsSubmitting(true)
      await createNote(taskId, newNote)
      setNewNote('')
      toast({
        title: 'Success',
        description: 'Note added',
      })
      onNoteAdded?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add note',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    try {
      setDeleting(noteId)
      await deleteNote(noteId)
      toast({
        title: 'Success',
        description: 'Note deleted',
      })
      onNoteDeleted?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete note',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleStartEdit = (note: TaskNote) => {
    setEditingId(note.id)
    setEditingContent(note.content)
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editingContent.trim()) return

    try {
      await updateNote(noteId, editingContent)
      setEditingId(null)
      setEditingContent('')
      toast({
        title: 'Success',
        description: 'Note updated',
      })
      onNoteUpdated?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update note',
        variant: 'destructive',
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="w-full p-2 min-h-[60px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
          style={{
            '--tw-ring-color': primary + '20',
          } as React.CSSProperties}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newNote.trim()}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />}
          Add Note
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-center py-4 text-slate-400 dark:text-slate-600 text-sm">
            No notes yet
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2"
            >
              {editingId === note.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                    style={{
                      '--tw-ring-color': primary + '20',
                    } as React.CSSProperties}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      style={{ color: primary }}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {note.author?.avatar_url && (
                        <img
                          src={note.author.avatar_url}
                          alt={note.author.full_name || 'User'}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <p className="font-medium">
                          {note.author?.full_name || 'Unknown'}
                        </p>
                        <p>{formatDate(note.updated_at)}</p>
                      </div>
                    </div>
                    {note.user_id === currentUserId && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          style={{ color: primary }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          disabled={deleting === note.id}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deleting === note.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
