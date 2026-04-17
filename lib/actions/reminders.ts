'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type Reminder = Database['public']['Tables']['reminders']['Row']

export async function addReminder(
  eventId: string,
  minutesBefore: number,
  channel: 'in_app' | 'email' | 'push'
): Promise<Reminder> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: reminder, error } = await supabase
    .from('reminders')
    .insert({
      event_id: eventId,
      user_id: user.id,
      minutes_before: minutesBefore,
      channel: channel,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/calendar')
  return reminder
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/calendar')
}

export async function getUpcomingReminders(): Promise<Reminder[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select()
    .eq('user_id', user.id)
    .eq('sent', false)
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10)

  if (error) {
    throw new Error(error.message)
  }

  return reminders
}
