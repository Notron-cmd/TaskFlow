'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Note } from '@/stores/notesStore'

export interface NoteInput {
  title: string
  content: string
  category?: string
  tags?: string[]
  color?: string
}

/**
 * Create a new note
 */
export async function createNote(data: NoteInput): Promise<any> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: note, error } = await supabase
    .from('notes')
    .insert([
      {
        title: data.title,
        content: data.content,
        category: data.category || null,
        tags: data.tags || [],
        color: data.color || 'blue',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/notes')
  return note
}

/**
 * Get all notes for current user
 */
export async function getNotes(): Promise<any[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return notes || []
}

/**
 * Get a single note by ID
 */
export async function getNoteById(noteId: string): Promise<any> {
  const supabase = await createClient()

  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return note
}

/**
 * Update a note
 */
export async function updateNote(noteId: string, updates: Partial<NoteInput>): Promise<any> {
  const supabase = await createClient()

  const { data: note, error } = await supabase
    .from('notes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/notes')
  return note
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('notes').delete().eq('id', noteId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/notes')
}

/**
 * Toggle pin status of a note
 */
export async function toggleNotePin(noteId: string, pinned: boolean): Promise<any> {
  const supabase = await createClient()

  const { data: note, error } = await supabase
    .from('notes')
    .update({ pinned })
    .eq('id', noteId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/notes')
  return note
}

/**
 * Search notes
 */
export async function searchNotes(query: string): Promise<any[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return notes || []
}
