'use server'

import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

type TaskAttachment = {
  id: string
  task_id: string
  file_name: string
  file_size: number
  storage_path: string
  created_at: string
}

export async function getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: attachments, error } = await supabase
    .from('task_attachments')
    .select('id, task_id, file_name, file_size, storage_path, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return attachments || []
}

export async function createComment(
  taskId: string,
  content: string
): Promise<{ id: string; content: string; created_at: string; user_id: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!content.trim()) {
    throw new Error('Comment cannot be empty')
  }

  const { data: comment, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      content: content.trim(),
      user_id: user.id,
    })
    .select('id, content, created_at, user_id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return comment
}

export async function getTaskComments(taskId: string): Promise<
  Array<{
    id: string
    content: string
    created_at: string
    user_id: string
    author: { full_name: string | null; avatar_url: string | null } | null
  }>
> {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: comments, error } = await supabase
    .from('task_comments')
    .select('id, content, created_at, user_id, profiles!task_comments_user_id_fkey(full_name, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (comments || []).map((c: any) => {
    // Handle both possible response structures
    const profiles = c.profiles || c['profiles!task_comments_user_id_fkey']
    return {
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id,
      author: profiles,
    }
  })
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify user owns the comment
  const { data: comment, error: fetchError } = await supabase
    .from('task_comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (fetchError || !comment) {
    throw new Error('Comment not found')
  }

  if (comment.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { error: deleteError } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }
}
