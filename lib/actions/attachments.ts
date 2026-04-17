'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type TaskAttachment = Database['public']['Tables']['task_attachments']['Row']

export async function uploadAttachment(
  taskId: string,
  file: File
): Promise<TaskAttachment> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${user.id}/${taskId}/${Date.now()}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: attachment, error: insertError } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      uploaded_by: user.id,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  revalidatePath('/board')
  return attachment
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: attachment, error: fetchError } = await supabase
    .from('task_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([attachment.storage_path])

  if (storageError) {
    throw new Error(storageError.message)
  }

  const { error: deleteError } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  revalidatePath('/board')
}

export async function getAttachmentUrl(
  storagePath: string
): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(storagePath, 3600)

  if (error) {
    return null
  }

  return data.signedUrl
}
