'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Subtask {
  id: string
  taskId: string
  title: string
  description?: string
  completed: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export interface SubtaskState {
  subtasks: Record<string, Subtask[]> // taskId -> subtasks
  isLoading: boolean

  // Actions
  setSubtasks: (taskId: string, subtasks: Subtask[]) => void
  addSubtask: (taskId: string, subtask: Subtask) => void
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  reorderSubtasks: (taskId: string, subtasks: Subtask[]) => void
  getSubtasksByTaskId: (taskId: string) => Subtask[]
  getProgress: (taskId: string) => { completed: number; total: number; percentage: number }
  setLoading: (loading: boolean) => void
}

export const useSubtaskStore = create<SubtaskState>()(
  persist(
    (set, get) => ({
      subtasks: {},
      isLoading: false,

      setSubtasks: (taskId: string, subtasks: Subtask[]) => {
        set((state) => ({
          subtasks: {
            ...state.subtasks,
            [taskId]: subtasks,
          },
        }))
      },

      addSubtask: (taskId: string, subtask: Subtask) => {
        set((state) => {
          const existing = state.subtasks[taskId] || []
          return {
            subtasks: {
              ...state.subtasks,
              [taskId]: [...existing, subtask],
            },
          }
        })
      },

      updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
        set((state) => {
          const existing = state.subtasks[taskId] || []
          return {
            subtasks: {
              ...state.subtasks,
              [taskId]: existing.map((s) =>
                s.id === subtaskId
                  ? { ...s, ...updates, updatedAt: new Date().toISOString() }
                  : s
              ),
            },
          }
        })
      },

      deleteSubtask: (taskId: string, subtaskId: string) => {
        set((state) => {
          const existing = state.subtasks[taskId] || []
          return {
            subtasks: {
              ...state.subtasks,
              [taskId]: existing.filter((s) => s.id !== subtaskId),
            },
          }
        })
      },

      toggleSubtask: (taskId: string, subtaskId: string) => {
        set((state) => {
          const existing = state.subtasks[taskId] || []
          return {
            subtasks: {
              ...state.subtasks,
              [taskId]: existing.map((s) =>
                s.id === subtaskId
                  ? { ...s, completed: !s.completed, updatedAt: new Date().toISOString() }
                  : s
              ),
            },
          }
        })
      },

      reorderSubtasks: (taskId: string, subtasks: Subtask[]) => {
        set((state) => ({
          subtasks: {
            ...state.subtasks,
            [taskId]: subtasks.map((s, idx) => ({ ...s, position: idx })),
          },
        }))
      },

      getSubtasksByTaskId: (taskId: string) => {
        const state = get()
        return (state.subtasks[taskId] || []).sort((a, b) => a.position - b.position)
      },

      getProgress: (taskId: string) => {
        const state = get()
        const subtasks = state.subtasks[taskId] || []
        const completed = subtasks.filter((s) => s.completed).length
        const total = subtasks.length
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)

        return { completed, total, percentage }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'subtask-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
