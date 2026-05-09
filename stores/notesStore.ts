import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Note {
  id: string
  title: string
  content: string
  category?: string
  tags?: string[]
  created_at: string
  updated_at: string
  color?: string
  pinned?: boolean
}

interface NotesStoreState {
  notes: Note[]
  selectedNoteId: string | null
  searchQuery: string
  selectedCategory: string | null
  isLoading: boolean
}

interface NotesStoreActions {
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  selectNote: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void
  setLoading: (loading: boolean) => void
  togglePin: (id: string) => void
}

export const useNotesStore = create<NotesStoreState & NotesStoreActions>()(
  persist(
    (set) => ({
      notes: [],
      selectedNoteId: null,
      searchQuery: '',
      selectedCategory: null,
      isLoading: false,

      setNotes: (notes) => set({ notes }),

      addNote: (note) =>
        set((state) => {
          // Check if note with same ID already exists
          const exists = state.notes.some((n) => n.id === note.id)
          if (exists) {
            return { notes: state.notes.map((n) => (n.id === note.id ? note : n)) }
          }
          return { notes: [note, ...state.notes] }
        }),

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((note) => (note.id === id ? { ...note, ...updates } : note)),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        })),

      selectNote: (id) => set({ selectedNoteId: id }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      setLoading: (loading) => set({ isLoading: loading }),

      togglePin: (id) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, pinned: !note.pinned } : note
          ),
        })),
    }),
    {
      name: 'notes-store',
      version: 1,
    }
  )
)

export const useNotesList = (notes: Note[]) => {
  // Filter and sort notes based on search and category
  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes('') &&
        note.content.toLowerCase().includes('')
      return matchesSearch
    })
    .sort((a, b) => {
      // Pinned notes first
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      // Then by date (newest first)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  return filteredNotes
}
