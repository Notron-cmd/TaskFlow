'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { Sun, Moon, Settings } from 'lucide-react'

export function ThemeToggle() {
  const [isMounted, setIsMounted] = useState(false)
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)

  useEffect(() => {
    setIsMounted(true)
    console.log('[ThemeToggle] Component mounted, initial theme:', theme)
  }, [])

  if (!isMounted) {
    return (
      <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-gray-600 dark:text-slate-300 opacity-50" disabled>
        <Sun size={18} />
      </button>
    )
  }

  const toggleTheme = () => {
    const themes = ['dark', 'light', 'system'] as const
    const currentIndex = themes.indexOf(theme as any)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    
    console.log('[ThemeToggle] Toggle clicked!')
    console.log('[ThemeToggle] Current theme:', theme)
    console.log('[ThemeToggle] Next theme:', nextTheme)
    console.log('[ThemeToggle] HTML document class before:', document.documentElement.className)
    
    setTheme(nextTheme)
    
    // Verify store was updated
    setTimeout(() => {
      console.log('[ThemeToggle] HTML document class after:', document.documentElement.className)
      const state = useSettingsStore.getState()
      console.log('[ThemeToggle] Store theme after update:', state.theme)
    }, 100)
  }

  const getIcon = () => {
    if (theme === 'dark') return <Moon size={18} />
    if (theme === 'light') return <Sun size={18} />
    return <Settings size={18} />
  }

  const getLabel = () => {
    if (theme === 'dark') return 'Dark'
    if (theme === 'light') return 'Light'
    return 'System'
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-all text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white"
      title={`Theme: ${getLabel()}. Click to change.`}
    >
      {getIcon()}
      <span className="text-xs font-medium">{getLabel()}</span>
    </button>
  )
}
