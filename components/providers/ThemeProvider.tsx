'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { colorDefinitions } from '@/lib/themes/colorDefinitions'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  const theme = useSettingsStore((state) => state.theme)
  const themeColor = useSettingsStore((state) => state.themeColor)

  // Set mounted flag and apply theme/color in single effect
  useEffect(() => {
    setIsMounted(true)
    
    const root = document.documentElement
    
    // Apply theme
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const targetTheme = isDark ? 'dark' : 'light'
      root.classList.remove('dark', 'light')
      root.classList.add(targetTheme)
    } else {
      root.classList.remove('dark', 'light')
      root.classList.add(theme)
    }
    
    // Apply color
    applyThemeColor(themeColor, theme, root)
  }, [theme, themeColor])

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
