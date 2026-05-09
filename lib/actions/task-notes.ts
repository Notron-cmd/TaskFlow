'use server'

import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

export type TaskNote = {
  id: string
  task_id: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
  author?: { full_name: string | null; avatar_url: string | null } | null
}

export async function getTaskNotes(taskId: string): Promise<TaskNote[]> {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: notes, error } = await supabase
    .from('task_notes')
    .select('id, task_id, content, user_id, created_at, updated_at, profiles!task_notes_user_id_fkey(full_name, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (notes || []).map((note: any) => ({
    ...note,
    author: note.profiles,
  }))
}

export async function createNote(
  taskId: string,
  content: string
): Promise<TaskNote> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!content.trim()) {
    throw new Error('Note cannot be empty')
  }

  const { data: note, error } = await supabase
    .from('task_notes')
    .insert({
      task_id: taskId,
      content: content.trim(),
      user_id: user.id,
    })
    .select('id, task_id, content, user_id, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return note as TaskNote
}

export async function updateNote(
  noteId: string,
  content: string
): Promise<TaskNote> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!content.trim()) {
    throw new Error('Note cannot be empty')
  }

  // First verify the note belongs to the current user
  const { data: existingNote } = await supabase
    .from('task_notes')
    .select('user_id')
    .eq('id', noteId)
    .single()

  if (!existingNote || existingNote.user_id !== user.id) {
    throw new Error('Unauthorized to edit this note')
  }

  const { data: updatedNote, error } = await supabase
    .from('task_notes')
    .update({
      content: content.trim(),
    })
    .eq('id', noteId)
    .select('id, task_id, content, user_id, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedNote as TaskNote
}

export async function deleteNote(noteId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // First verify the note belongs to the current user
  const { data: note } = await supabase
    .from('task_notes')
    .select('user_id')
    .eq('id', noteId)
    .single()

  if (!note || note.user_id !== user.id) {
    throw new Error('Unauthorized to delete this note')
  }

  const { error } = await supabase
    .from('task_notes')
    .delete()
    .eq('id', noteId)

  if (error) {
    throw new Error(error.message)
  }
}
