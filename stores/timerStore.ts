'use client'

import { create } from 'zustand'

export interface TimerSession {
  id: string
  taskId: string
  startedAt: Date
  duration: number // in seconds
  isRunning: boolean
  pausedDuration?: number // accumulated paused time
}

export interface TimerState {
  sessions: Record<string, TimerSession>
  activeTaskId: string | null
  totalTimeByTask: Record<string, number> // taskId -> minutes spent

  // Actions
  startTimer: (taskId: string) => void
  pauseTimer: (taskId: string) => void
  resumeTimer: (taskId: string) => void
  stopTimer: (taskId: string) => Promise<number> // returns duration in minutes
  resetTimer: (taskId: string) => void
  getElapsedTime: (taskId: string) => number // returns seconds
  setTotalTimeByTask: (taskId: string, minutes: number) => void
}

export const useTimerStore = create<TimerState>((set, get) => {
  // Update active timer every second
  if (typeof window !== 'undefined') {
    setInterval(() => {
      const state = get()
      let hasActiveTimer = false

      Object.entries(state.sessions).forEach(([_, session]) => {
        if (session.isRunning) {
          hasActiveTimer = true
        }
      })

      if (hasActiveTimer) {
        set({ sessions: { ...state.sessions } })
      }
    }, 1000)
  }

  return {
    sessions: {},
    activeTaskId: null,
    totalTimeByTask: {},

    startTimer: (taskId: string) => {
      set((state) => {
        const existingSession = state.sessions[taskId]

        // If there's a paused session, resume it
        if (existingSession && !existingSession.isRunning) {
          return {
            sessions: {
              ...state.sessions,
              [taskId]: {
                ...existingSession,
                isRunning: true,
              },
            },
            activeTaskId: taskId,
          }
        }

        // Create new session
        const newSession: TimerSession = {
          id: `session-${taskId}-${Date.now()}`,
          taskId,
          startedAt: new Date(),
          duration: 0,
          isRunning: true,
        }

        return {
          sessions: {
            ...state.sessions,
            [taskId]: newSession,
          },
          activeTaskId: taskId,
        }
      })
    },

    pauseTimer: (taskId: string) => {
      set((state) => {
        const session = state.sessions[taskId]
        if (!session || !session.isRunning) return state

        const elapsedSeconds = Math.floor(
          (Date.now() - session.startedAt.getTime()) / 1000
        )

        return {
          sessions: {
            ...state.sessions,
            [taskId]: {
              ...session,
              isRunning: false,
              duration: session.duration + elapsedSeconds,
              startedAt: new Date(),
            },
          },
          activeTaskId: null,
        }
      })
    },

    resumeTimer: (taskId: string) => {
      set((state) => {
        const session = state.sessions[taskId]
        if (!session || session.isRunning) return state

        return {
          sessions: {
            ...state.sessions,
            [taskId]: {
              ...session,
              isRunning: true,
              startedAt: new Date(),
            },
          },
          activeTaskId: taskId,
        }
      })
    },

    stopTimer: async (taskId: string) => {
      return new Promise((resolve) => {
        set((state) => {
          const session = state.sessions[taskId]
          if (!session) {
            resolve(0)
            return state
          }

          let totalSeconds = session.duration
          if (session.isRunning) {
            const elapsedSeconds = Math.floor(
              (Date.now() - session.startedAt.getTime()) / 1000
            )
            totalSeconds += elapsedSeconds
          }

          const minutes = Math.round(totalSeconds / 60)
          const currentTotal = state.totalTimeByTask[taskId] || 0

          resolve(minutes)

          const newSessions = { ...state.sessions }
          delete newSessions[taskId]

          return {
            sessions: newSessions,
            activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId,
            totalTimeByTask: {
              ...state.totalTimeByTask,
              [taskId]: currentTotal + minutes,
            },
          }
        })
      })
    },

    resetTimer: (taskId: string) => {
      set((state) => {
        const newSessions = { ...state.sessions }
        delete newSessions[taskId]

        return {
          sessions: newSessions,
          activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId,
        }
      })
    },

    getElapsedTime: (taskId: string) => {
      const state = get()
      const session = state.sessions[taskId]
      if (!session) return 0

      let elapsed = session.duration
      if (session.isRunning) {
        const now = new Date()
        elapsed += Math.floor((now.getTime() - session.startedAt.getTime()) / 1000)
      }
      return elapsed
    },

    setTotalTimeByTask: (taskId: string, minutes: number) => {
      set((state) => ({
        totalTimeByTask: {
          ...state.totalTimeByTask,
          [taskId]: minutes,
        },
      }))
    },
  }
})
