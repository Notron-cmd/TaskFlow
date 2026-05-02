import { useSettingsStore, type ThemeColor } from '@/stores/settingsStore'
import { colorDefinitions } from '@/lib/themes/colorDefinitions'

export function useThemeColor() {
  const themeColor = useSettingsStore((state) => state.themeColor)
  const theme = useSettingsStore((state) => state.theme)

  // Determine actual theme (light or dark)
  const actualTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : (theme as 'light' | 'dark')

  const colorSet = colorDefinitions[themeColor][actualTheme]

  return {
    themeColor,
    theme,
    actualTheme,
    // Individual colors
    primary: colorSet.primary,
    secondary: colorSet.secondary,
    accent: colorSet.accent,
    background: colorSet.background,
    text: colorSet.text,
    border: colorSet.border,
    hover: colorSet.hover,
    focus: colorSet.focus,
    // Full color set
    colors: colorSet,
  }
}
