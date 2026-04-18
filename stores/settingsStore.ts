import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'system'
export type TaskSort = 'due-date' | 'created-date' | 'priority' | 'title'
export type CalendarView = 'month' | 'week' | 'day'

export interface SettingsState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Notifications
  emailNotifications: boolean
  setEmailNotifications: (enabled: boolean) => void

  inAppNotifications: boolean
  setInAppNotifications: (enabled: boolean) => void

  // Task Preferences
  taskSort: TaskSort
  setTaskSort: (sort: TaskSort) => void

  showCompletedTasks: boolean
  setShowCompletedTasks: (show: boolean) => void

  // Calendar
  calendarView: CalendarView
  setCalendarView: (view: CalendarView) => void

  // General
  compactMode: boolean
  setCompactMode: (compact: boolean) => void

  // Time Format
  use24HourFormat: boolean
  setUse24HourFormat: (use24: boolean) => void

  // Reset to defaults
  resetSettings: () => void
}

const defaultSettings = {
  theme: 'dark' as Theme,
  emailNotifications: true,
  inAppNotifications: true,
  taskSort: 'due-date' as TaskSort,
  showCompletedTasks: true,
  calendarView: 'month' as CalendarView,
  compactMode: false,
  use24HourFormat: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => {
        console.log('Setting theme to:', theme)
        set({ theme })
      },
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      setInAppNotifications: (enabled) => set({ inAppNotifications: enabled }),
      setTaskSort: (sort) => set({ taskSort: sort }),
      setShowCompletedTasks: (show) => set({ showCompletedTasks: show }),
      setCalendarView: (view) => set({ calendarView: view }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      setUse24HourFormat: (use24) => set({ use24HourFormat: use24 }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'taskflow-settings',
      // Ensure localStorage is available
      storage: typeof window !== 'undefined' ? undefined : undefined,
    }
  )
)
