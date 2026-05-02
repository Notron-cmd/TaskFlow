import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'system'
export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink' | 'amber'
export type TaskSort = 'due-date' | 'created-date' | 'priority' | 'title'
export type CalendarView = 'month' | 'week' | 'day'

export interface SettingsState {
  // Hydration
  _isHydrated?: boolean

  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Theme Color
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void

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

  // Hydration
  setHydrated: (hydrated: boolean) => void
}

const defaultSettings = {
  theme: 'dark' as Theme,
  themeColor: 'blue' as ThemeColor,
  emailNotifications: true,
  inAppNotifications: true,
  taskSort: 'due-date' as TaskSort,
  showCompletedTasks: true,
  calendarView: 'month' as CalendarView,
  compactMode: false,
  use24HourFormat: true,
  _isHydrated: false,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => {
        console.log('[SettingsStore] Setting theme to:', theme)
        set({ theme })
      },
      setThemeColor: (color) => {
        console.log('[SettingsStore] Setting theme color to:', color)
        set({ themeColor: color })
      },
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      setInAppNotifications: (enabled) => set({ inAppNotifications: enabled }),
      setTaskSort: (sort) => set({ taskSort: sort }),
      setShowCompletedTasks: (show) => set({ showCompletedTasks: show }),
      setCalendarView: (view) => set({ calendarView: view }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      setUse24HourFormat: (use24) => set({ use24HourFormat: use24 }),

      resetSettings: () => set(defaultSettings),
      
      setHydrated: (hydrated) => set({ _isHydrated: hydrated }),
    }),
    {
      name: 'taskflow-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        console.log('[SettingsStore] Rehydrated from localStorage:', state)
        if (state) {
          state.setHydrated(true)
        }
      },
    }
  )
)
