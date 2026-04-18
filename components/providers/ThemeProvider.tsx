'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    console.log('[ThemeProvider] Initializing with theme:', theme)
    const root = document.documentElement
    applyTheme(theme, root)
  }, [theme])

  return <>{children}</>
}

function applyTheme(theme: string, root: HTMLElement) {
  console.log('[applyTheme] Applying theme:', theme)
  console.log('[applyTheme] Before:', root.className)
  
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const targetTheme = isDark ? 'dark' : 'light'
    root.classList.remove('dark', 'light')
    root.classList.add(targetTheme)
    console.log('[applyTheme] System theme detected as:', targetTheme)
  } else {
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
  }
  
  console.log('[applyTheme] After:', root.className)
}
