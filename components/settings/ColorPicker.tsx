'use client'

import { useEffect } from 'react'
import { useSettingsStore, type ThemeColor } from '@/stores/settingsStore'
import { colorDefinitions, colorNames } from '@/lib/themes/colorDefinitions'

export function ColorPicker() {
  const themeColor = useSettingsStore((state) => state.themeColor)
  const setThemeColor = useSettingsStore((state) => state.setThemeColor)
  const theme = useSettingsStore((state) => state.theme)

  // Debug: log whenever color changes
  useEffect(() => {
    console.log('[ColorPicker] Current color:', themeColor)
    console.log('[ColorPicker] Current theme:', theme)
    console.log('[ColorPicker] Store state:', useSettingsStore.getState())
  }, [themeColor, theme])

  // Determine actual theme for preview
  let actualTheme: 'light' | 'dark' = theme as 'light' | 'dark'
  if (theme === 'system') {
    actualTheme = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light'
  }

  const colors = Object.keys(colorDefinitions) as ThemeColor[]

  const handleColorChange = (color: ThemeColor) => {
    console.log('[ColorPicker] Clicked color:', color)
    console.log('[ColorPicker] Before setThemeColor - current themeColor:', themeColor)
    
    setThemeColor(color)
    
    // Log state after change
    setTimeout(() => {
      const state = useSettingsStore.getState()
      console.log('[ColorPicker] After setThemeColor - new themeColor:', state.themeColor)
    }, 0)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-slate-400">
        Select your preferred theme color
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {colors.map((color) => {
          const colorDef = colorDefinitions[color]
          const colorSet = colorDef[actualTheme]
          const isSelected = themeColor === color

          return (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={`relative group overflow-hidden rounded-lg transition-all ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-slate-800'
                  : 'hover:scale-105'
              }`}
              style={{
                ringColor: colorSet.primary,
              }}
              title={colorNames[color]}
            >
              {/* Color preview */}
              <div
                className="w-full h-16 rounded-lg border-2 transition-all"
                style={{
                  backgroundColor: colorSet.primary,
                  borderColor: colorSet.accent,
                }}
              />

              {/* Selected indicator */}
              {isSelected && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="text-white font-bold text-xl">✓</div>
                </div>
              )}

              {/* Hover effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />

              {/* Label */}
              <div className="mt-2 text-sm font-medium text-gray-700 dark:text-slate-300 text-center">
                {colorNames[color]}
              </div>
            </button>
          )
        })}
      </div>

      {/* Color preview section */}
      <div className="mt-6 p-4 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
          Preview - Current Color: <span className="text-purple-600 dark:text-purple-400">{themeColor}</span>
        </p>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <div
              className="w-6 h-6 rounded"
              style={{
                backgroundColor: colorDefinitions[themeColor][actualTheme].primary,
              }}
            />
            <span className="text-sm text-gray-600 dark:text-slate-400">Primary - {colorDefinitions[themeColor][actualTheme].primary}</span>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className="w-6 h-6 rounded"
              style={{
                backgroundColor: colorDefinitions[themeColor][actualTheme].accent,
              }}
            />
            <span className="text-sm text-gray-600 dark:text-slate-400">Accent - {colorDefinitions[themeColor][actualTheme].accent}</span>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className="w-6 h-6 rounded"
              style={{
                backgroundColor: colorDefinitions[themeColor][actualTheme].secondary,
              }}
            />
            <span className="text-sm text-gray-600 dark:text-slate-400">Secondary - {colorDefinitions[themeColor][actualTheme].secondary}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
