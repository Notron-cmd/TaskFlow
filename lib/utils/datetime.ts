/**
 * Timezone conversion utilities for datetime-local inputs
 * Fixes issue where UTC times display incorrectly
 */

/**
 * Convert UTC ISO string to local datetime string for datetime-local input
 * @param isoString UTC datetime string (e.g., "2026-04-18T10:33:00Z")
 * @returns Local datetime string (e.g., "2026-04-18T17:33")
 */
export function formatUtcForDatetimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return ''

  const date = new Date(isoString)
  // Get timezone offset in milliseconds
  const offset = date.getTimezoneOffset() * 60000
  // Adjust UTC time to local time
  const localDate = new Date(date.getTime() - offset)
  // Return ISO format without timezone suffix: YYYY-MM-DDTHH:mm
  return localDate.toISOString().slice(0, 16)
}

/**
 * Convert datetime-local input value to UTC Date object
 * @param dateTimeLocalString Local datetime string from input (e.g., "2026-04-18T17:33")
 * @returns Date object representing the UTC equivalent
 */
export function parseDatetimeLocal(dateTimeLocalString: string): Date {
  // datetime-local input value is interpreted as local time by JS
  const localDate = new Date(dateTimeLocalString)
  return localDate
  // Note: toISOString() will correctly convert this to UTC
}

/**
 * Get timezone offset label for display
 * @returns String like "UTC+7" or "UTC-5"
 */
export function getTimezoneLabel(): string {
  const now = new Date()
  const offsetMinutes = now.getTimezoneOffset()
  const offsetHours = -offsetMinutes / 60
  const sign = offsetHours >= 0 ? '+' : ''
  return `UTC${sign}${offsetHours}`
}
