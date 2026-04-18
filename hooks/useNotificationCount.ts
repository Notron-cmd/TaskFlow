'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PendingReminder {
  id: string
  scheduled_at: string
  minutes_before: number
  calendar_events?: {
    id: string
    title: string
  } | null
}

export function useNotificationCount() {
  const [count, setCount] = useState(0)
  const [reminders, setReminders] = useState<PendingReminder[]>([])
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    const fetchPendingReminders = async () => {
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user || !isMountedRef.current) return

        const now = new Date().toISOString()

        const { data, error } = await supabase
          .from('reminders')
          .select(
            `
            id,
            scheduled_at,
            minutes_before,
            calendar_events(id, title)
          `
          )
          .eq('user_id', user.id)
          .eq('channel', 'in_app')
          .eq('sent', false)
          .lte('scheduled_at', now)
          .limit(99)

        if (error) {
          console.error('[useNotificationCount] Error:', error)
          return
        }

        if (!isMountedRef.current) return

        setReminders(data || [])
        setCount((data || []).length)

        console.log(
          `[useNotificationCount] Found ${(data || []).length} pending reminders`
        )
      } catch (error) {
        console.error('[useNotificationCount] Fetch error:', error)
      }
    }

    // Initial fetch
    fetchPendingReminders()

    // Poll every 30 seconds
    const pollInterval = setInterval(() => {
      if (isMountedRef.current) {
        fetchPendingReminders()
      }
    }, 30000)

    // Subscribe to real-time changes
    const supabase = createClient()
    const channelId = Math.random().toString(36).substring(7)
    const channel = supabase
      .channel(`notifications-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reminders',
        },
        () => {
          if (isMountedRef.current) {
            fetchPendingReminders()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reminders',
        },
        () => {
          if (isMountedRef.current) {
            fetchPendingReminders()
          }
        }
      )
      .subscribe()

    return () => {
      isMountedRef.current = false
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [])

  return { count, reminders }
}
