import { useSettingsStore } from '@/stores/settingsStore'

export function useTimeFormat() {
  const use24HourFormat = useSettingsStore((state) => state.use24HourFormat)

  return {
    formatTime: (date: Date) => {
      if (use24HourFormat) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })
      } else {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        })
      }
    },
    formatDateTime: (date: Date) => {
      if (use24HourFormat) {
        return date.toLocaleString('en-US', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })
      } else {
        return date.toLocaleString('en-US', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        })
      }
    },
  }
}
