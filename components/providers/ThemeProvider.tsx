'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { colorDefinitions } from '@/lib/themes/colorDefinitions'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  const theme = useSettingsStore((state) => state.theme)
  const themeColor = useSettingsStore((state) => state.themeColor)

  // Set mounted flag
  useEffect(() => {
    console.log('[ThemeProvider] Mounted')
    setIsMounted(true)
  }, [])

  // Apply theme class whenever theme changes
  useEffect(() => {
    if (!isMounted) return
    
    console.log('[ThemeProvider] Theme changed to:', theme)
    const root = document.documentElement
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const targetTheme = isDark ? 'dark' : 'light'
      root.classList.remove('dark', 'light')
      root.classList.add(targetTheme)
      console.log('[ThemeProvider] Applied system theme:', targetTheme)
    } else {
      root.classList.remove('dark', 'light')
      root.classList.add(theme)
      console.log('[ThemeProvider] Applied explicit theme:', theme)
    }
  }, [isMounted, theme])

  // Apply color CSS variables whenever color changes
  useEffect(() => {
    if (!isMounted) return
    
    console.log('[ThemeProvider] Color changed to:', themeColor)
    const root = document.documentElement
    applyThemeColor(themeColor, theme, root)
  }, [isMounted, themeColor, theme])

  return <>{children}</>
}

function applyThemeColor(colorName: string, theme: string, root: HTMLElement) {
  console.log('[applyThemeColor] Start - colorName:', colorName, 'theme:', theme)
  
  // Determine actual theme
  const actualTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : (theme as 'light' | 'dark')
  
  console.log('[applyThemeColor] Actual theme:', actualTheme)
  
  // Get color definition
  const colors = colorDefinitions[colorName as keyof typeof colorDefinitions]
  if (!colors) {
    console.error('[applyThemeColor] Color definition not found for:', colorName)
    return
  }
  
  const colorSet = colors[actualTheme]
  if (!colorSet) {
    console.error('[applyThemeColor] Color set not found for theme:', actualTheme)
    return
  }
  
  console.log('[applyThemeColor] Applying colors:', colorSet)
  
  // Apply each color as CSS variable
  Object.entries(colorSet).forEach(([key, value]) => {
    const varName = `--color-${key}`
    root.style.setProperty(varName, value)
    console.log(`[applyThemeColor] Set ${varName} = ${value}`)
  })
  
  console.log('[applyThemeColor] Complete - root.style:', root.getAttribute('style'))
}
