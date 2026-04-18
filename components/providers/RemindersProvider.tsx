'use client'

import { ReactNode } from 'react'
import { useRealtimeReminders } from '@/hooks/useRealtimeReminders'

function RemindersListener() {
  // This component just calls the hook to setup listeners
  useRealtimeReminders()
  return null
}

export function RemindersProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <RemindersListener />
      {children}
    </>
  )
}
