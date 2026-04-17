'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { eventSchema, type EventInput } from '@/lib/validations/event.schema'
import type { Database } from '@/types/database.types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

export async function createEvent(data: EventInput): Promise<CalendarEvent> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const validation = eventSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message)
  }

  const { data: event, error } = await supabase
    .from('calendar_events')
    .insert({
      ...validation.data,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/calendar')
  return event
}

export async function updateEvent(
  eventId: string,
  updates: Partial<EventInput>
): Promise<CalendarEvent> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: event, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/calendar')
  revalidatePath('/board')
  return event
}

export async function rescheduleEvent(
  eventId: string,
  newStart: Date,
  newEnd: Date
): Promise<CalendarEvent> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: event, error } = await supabase
    .from('calendar_events')
    .update({
      start_at: newStart.toISOString(),
      end_at: newEnd.toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/calendar')
  revalidatePath('/board')
  return event
}

export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/calendar')
  revalidatePath('/board')
}
