import { create } from 'zustand'

export interface SearchResult {
  id: string
  type: 'task' | 'event'
  title: string
  description?: string
  status?: string
  priority?: string
  dueDate?: string
}

interface SearchState {
  query: string
  results: SearchResult[]
  isSearching: boolean
  isOpen: boolean
  setQuery: (query: string) => void
  setResults: (results: SearchResult[]) => void
  setIsSearching: (isSearching: boolean) => void
  setIsOpen: (isOpen: boolean) => void
  clearSearch: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isSearching: false,
  isOpen: false,
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setIsOpen: (isOpen) => set({ isOpen }),
  clearSearch: () => set({ query: '', results: [], isSearching: false, isOpen: false }),
}))
