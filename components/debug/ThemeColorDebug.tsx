'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function DebugThemeColor() {
  const [isOpen, setIsOpen] = useState(false)
  const themeColor = useSettingsStore((state) => state.themeColor)
  const theme = useSettingsStore((state) => state.theme)
  const isHydrated = useSettingsStore((state) => state._isHydrated)

  const handleTest = (color: any) => {
    console.log('[DebugThemeColor] Testing color:', color)
    useSettingsStore.setState({ themeColor: color })
    console.log('[DebugThemeColor] After setState:', useSettingsStore.getState().themeColor)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-3 py-2 bg-blue-500 text-white text-xs rounded z-50"
      >
        🐛 Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs z-50 max-w-sm max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold">Debug: Theme Color</span>
        <button onClick={() => setIsOpen(false)} className="text-red-400">✕</button>
      </div>
      
      <div className="space-y-2 font-mono text-xs">
        <div>
          <span className="text-yellow-400">themeColor:</span> <span className="text-green-400">{themeColor}</span>
        </div>
        <div>
          <span className="text-yellow-400">theme:</span> <span className="text-green-400">{theme}</span>
        </div>
        <div>
          <span className="text-yellow-400">isHydrated:</span> <span className="text-green-400">{String(isHydrated)}</span>
        </div>
        <div>
          <span className="text-yellow-400">localStorage:</span> 
          <div className="ml-2 mt-1 bg-gray-800 p-2 rounded">
            <pre className="text-xs">
              {JSON.stringify(
                JSON.parse(localStorage.getItem('taskflow-settings') || '{}'),
                null,
                2
              )}
            </pre>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-yellow-400 mb-2">Test:</div>
          <div className="flex flex-wrap gap-2">
            {['blue', 'green', 'purple', 'orange', 'red', 'cyan', 'pink', 'amber'].map((color) => (
              <button
                key={color}
                onClick={() => handleTest(color)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
