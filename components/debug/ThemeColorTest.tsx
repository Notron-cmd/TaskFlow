'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { colorDefinitions } from '@/lib/themes/colorDefinitions'

export function ThemeColorTest() {
  const themeColor = useSettingsStore((state) => state.themeColor)
  const theme = useSettingsStore((state) => state.theme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Determine actual theme
    let at: 'light' | 'dark' = theme as 'light' | 'dark'
    if (theme === 'system') {
      at = typeof window !== 'undefined' && 
        window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light'
    }
    setActualTheme(at)
  }, [theme])

  // Get current color set
  const colorSet = colorDefinitions[themeColor][actualTheme]

  return (
    <div className="mt-8 p-6 rounded-lg border-2 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800">
      <h3 className="font-bold text-lg mb-4">🎨 Live Theme Color Preview</h3>
      <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
        Current Color: <span className="font-bold text-purple-600 dark:text-purple-400">{themeColor.toUpperCase()}</span>
      </p>

      {/* Big color box */}
      <div
        className="w-full h-32 rounded-lg mb-4 border-4 shadow-lg"
        style={{
          backgroundColor: colorSet.primary,
          borderColor: colorSet.accent,
        }}
      />

      {/* Color grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Primary</div>
          <div
            className="h-16 rounded-lg border-2"
            style={{
              backgroundColor: colorSet.primary,
              borderColor: colorSet.accent,
            }}
          />
          <code className="text-xs mt-1 block text-gray-600 dark:text-slate-400">{colorSet.primary}</code>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Secondary</div>
          <div
            className="h-16 rounded-lg border-2"
            style={{
              backgroundColor: colorSet.secondary,
              borderColor: colorSet.primary,
            }}
          />
          <code className="text-xs mt-1 block text-gray-600 dark:text-slate-400">{colorSet.secondary}</code>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Accent</div>
          <div
            className="h-16 rounded-lg border-2"
            style={{
              backgroundColor: colorSet.accent,
              borderColor: colorSet.primary,
            }}
          />
          <code className="text-xs mt-1 block text-gray-600 dark:text-slate-400">{colorSet.accent}</code>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Focus</div>
          <div
            className="h-16 rounded-lg border-2"
            style={{
              backgroundColor: colorSet.focus,
              borderColor: colorSet.primary,
            }}
          />
          <code className="text-xs mt-1 block text-gray-600 dark:text-slate-400">{colorSet.focus}</code>
        </div>
      </div>

      {/* Test button with theme color */}
      <div className="mt-4">
        <button
          className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: colorSet.primary,
          }}
        >
          Test Button - {themeColor}
        </button>
      </div>
    </div>
  )
}
