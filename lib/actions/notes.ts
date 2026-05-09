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
 * Get all notes for current user (excluding archived)
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
    .eq('is_archived', false)
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

/**
 * Get archived notes for current user
 */
export async function getArchivedNotes(): Promise<any[]> {
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
    .eq('is_archived', true)
    .order('archived_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return notes || []
}

/**
 * Archive a note (soft delete)
 */
export async function archiveNote(noteId: string): Promise<any> {
  const supabase = await createClient()

  const { data: note, error } = await supabase
    .from('notes')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/notes')
  revalidatePath('/archive')
  return note
}

/**
 * Restore an archived note
 */
export async function restoreNote(noteId: string): Promise<any> {
  const supabase = await createClient()

  const { data: note, error } = await supabase
    .from('notes')
    .update({
      is_archived: false,
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/notes')
  revalidatePath('/archive')
  return note
}

/**
 * Permanently delete an archived note
 */
export async function permanentlyDeleteNote(noteId: string): Promise<void> {
  const supabase = await createClient()

  // Check if note is archived
  const { data: note, error: fetchError } = await supabase
    .from('notes')
    .select('is_archived')
    .eq('id', noteId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (!note.is_archived) {
    throw new Error('Can only permanently delete archived notes')
  }

  const { error } = await supabase.from('notes').delete().eq('id', noteId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/archive')
}
