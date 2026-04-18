'use client'

import { useEffect, useRef } from 'react'
import { useToast } from './use-toast'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Reminder = Database['public']['Tables']['reminders']['Row']

export function useRealtimeReminders() {
  const { toast } = useToast()
  const shownRemindersRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    const channelId = Math.random().toString(36).substring(7)

    // Fetch initial pending reminders
    const fetchPendingReminders = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log('[useRealtimeReminders] No authenticated user')
          return
        }

        // Use NOW() from server to avoid timezone mismatches
        const now = new Date().toISOString()

        // FIXED: Added user_id filter, proper channel filter, correct field selection
        const { data: reminders, error } = await supabase
          .from('reminders')
          .select(
            `
            id,
            scheduled_at,
            channel,
            minutes_before,
            calendar_events!reminders_event_id_fkey(
              id,
              title,
              description,
              start_at
            )
          `
          )
          .eq('user_id', user.id) // FIX #1: Filter by current user
          .eq('channel', 'in_app') // FIX #3: Only show in_app reminders
          .eq('sent', false)
          .lte('scheduled_at', now) // Reminders where trigger time has passed
          .limit(50)

        if (error) {
          console.error('[useRealtimeReminders] Fetch error:', error)
          return
        }

        if (!reminders || reminders.length === 0) {
          return
        }

        console.log(
          `[useRealtimeReminders] Found ${reminders.length} pending in-app reminders`
        )

        // Show toast for reminders not yet shown
        reminders.forEach((reminder: any) => {
          if (!shownRemindersRef.current.has(reminder.id)) {
            shownRemindersRef.current.add(reminder.id)

            // FIX #2: Get title from calendar_events relation (not from reminders)
            const eventTitle = reminder.calendar_events?.title || 'Task Reminder'
            const eventDescription = reminder.calendar_events?.description
            const minutesBefore = reminder.minutes_before

            // Format notification message
            const description =
              minutesBefore > 60
                ? `Reminder: Task due in ${Math.round(minutesBefore / 60)} hour(s)`
                : `Reminder: Task due in ${minutesBefore} minute(s)`

            console.log(
              `[useRealtimeReminders] Showing toast for reminder ${reminder.id}:`,
              eventTitle
            )

            toast({
              title: eventTitle,
              description,
              variant: 'default',
            })
          }
        })
      } catch (error) {
        console.error('[useRealtimeReminders] Error fetching reminders:', error)
      }
    }

    // Initial fetch
    fetchPendingReminders()

    // Poll every 30 seconds for new reminders (more frequent for better UX)
    const pollInterval = setInterval(() => {
      fetchPendingReminders()
    }, 30000) // Check every 30 seconds instead of 1 minute

    // Also subscribe to real-time updates on reminders table
    const channel = supabase
      .channel(`reminders-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reminders',
        },
        () => {
          // New reminder added - fetch pending
          fetchPendingReminders()
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
          // Reminder updated (e.g., marked as sent) - re-fetch
          fetchPendingReminders()
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [toast])
}

