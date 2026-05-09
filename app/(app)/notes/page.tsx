'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Download, Loader2 } from 'lucide-react'
import { useNotesStore, type Note } from '@/stores/notesStore'
import { getNotes, createNote, updateNote, deleteNote, toggleNotePin, searchNotes, archiveNote } from '@/lib/actions/notes'
import { NoteCard } from '@/components/shared/NoteCard'
import { NoteEditor } from '@/components/shared/NoteEditor'
import { NotesExportMenu } from '@/components/shared/NotesExportMenu'
import { toast } from '@/hooks/use-toast'
import { useThemeColor } from '@/hooks/useThemeColor'

export default function NotesPage() {
  const store = useNotesStore()
  const { primary } = useThemeColor()
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [])

  // Update filtered notes when search changes or notes change
  useEffect(() => {
    const filtered = store.notes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.category?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })

    // Sort: pinned first, then by updated_at
    const sorted = filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    setFilteredNotes(sorted)
  }, [store.notes, searchQuery])

  const loadNotes = async () => {
    try {
      setIsLoading(true)
      const notes = await getNotes()
      store.setNotes(notes)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load notes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = async (data: any) => {
    try {
      setIsCreating(true)
      const newNote = await createNote(data)
      store.addNote(newNote)
      toast({
        title: 'Success',
        description: 'Note created successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create note',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateNote = async (noteId: string, data: any) => {
    try {
      const updatedNote = await updateNote(noteId, data)
      store.updateNote(noteId, updatedNote)
      toast({
        title: 'Success',
        description: 'Note updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update note',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
      store.deleteNote(noteId)
      toast({
        title: 'Success',
        description: 'Note deleted',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete note',
        variant: 'destructive',
      })
    }
  }

  const handleArchiveNote = async (noteId: string) => {
    try {
      await archiveNote(noteId)
      store.deleteNote(noteId)
      toast({
        title: 'Success',
        description: 'Note archived',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive note',
        variant: 'destructive',
      })
    }
  }

  const handleTogglePin = async (noteId: string, pinned: boolean) => {
    try {
      await toggleNotePin(noteId, pinned)
      store.updateNote(noteId, { pinned })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update note',
        variant: 'destructive',
      })
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
  }

  const handleSaveNote = async (data: any) => {
    if (editingNote) {
      await handleUpdateNote(editingNote.id, data)
    } else {
      await handleCreateNote(data)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A14] p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-2">📝 My Notes</h1>
        <p className="text-slate-600 dark:text-slate-400">Organize your thoughts and ideas</p>
      </div>

      {/* Toolbar */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#16162A] text-black dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors"
            />
          </div>

          {/* Buttons */}
          <button
            onClick={() => {
              setEditingNote(null)
              setIsCreating(true)
            }}
            className="px-4 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
            style={{ backgroundColor: primary }}
          >
            <Plus size={18} />
            New Note
          </button>

          <button
            onClick={() => setIsExporting(true)}
            disabled={filteredNotes.length === 0}
            className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#16162A] text-black dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first note to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingNote(null)
                  setIsCreating(true)
                }}
                className="px-6 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                style={{ backgroundColor: primary }}
              >
                <Plus size={18} />
                Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onArchive={handleArchiveNote}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      <NoteEditor
        note={editingNote}
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false)
          setEditingNote(null)
        }}
        onSave={handleSaveNote}
      />

      {/* Export Menu */}
      <NotesExportMenu
        notes={filteredNotes}
        isOpen={isExporting}
        onClose={() => setIsExporting(false)}
      />
    </div>
  )
}
