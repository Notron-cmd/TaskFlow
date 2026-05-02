'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type TaskAttachment = Database['public']['Tables']['task_attachments']['Row']

export async function uploadAttachment(
  taskId: string,
  fileName: string,
  fileType: string,
  fileData: number[]
): Promise<TaskAttachment> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Convert array back to Uint8Array
  const uint8Array = new Uint8Array(fileData)
  const fileSize = uint8Array.byteLength

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (fileSize > maxSize) {
    throw new Error('File size exceeds 5MB limit')
  }

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${user.id}/${taskId}/${Date.now()}-${sanitizedName}`

  // Create Blob from Uint8Array
  const blob = new Blob([uint8Array], { type: fileType })

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(storagePath, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: fileType,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Only insert fields that exist in the table
  const { data: attachment, error: insertError } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      file_name: fileName,
      file_size: fileSize,
      mime_type: fileType,
      uploaded_by: user.id,
      storage_path: storagePath,
    })
    .select()
    .single()

  if (insertError) {
    // If database insert fails, cleanup the uploaded file
    await supabase.storage.from('attachments').remove([storagePath])
    throw new Error(`Failed to save attachment: ${insertError.message}`)
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
