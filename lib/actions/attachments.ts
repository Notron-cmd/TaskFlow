'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type TaskAttachment = Database['public']['Tables']['task_attachments']['Row']

export async function uploadAttachment(
  taskId: string,
  fileName: string,
  fileType: string,
  fileData: string
): Promise<TaskAttachment> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Decode base64 string to binary
  const binaryString = atob(fileData)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const fileSize = bytes.byteLength

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (fileSize > maxSize) {
    throw new Error('File size exceeds 5MB limit')
  }

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${user.id}/${taskId}/${Date.now()}-${sanitizedName}`

  // Create Blob from bytes
  const blob = new Blob([bytes], { type: fileType })

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

  // Step 1: Fetch attachment details
  const { data: attachment, error: fetchError } = await supabase
    .from('task_attachments')
    .select('storage_path, task_id')
    .eq('id', attachmentId)
    .single()

  if (fetchError || !attachment) {
    throw new Error(`Attachment not found: ${fetchError?.message || 'Unknown error'}`)
  }

  if (!attachment.storage_path) {
    throw new Error('Invalid attachment: missing storage_path')
  }

  // Step 2: Delete from storage
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([attachment.storage_path])

  // Note: Don't fail if storage delete fails - file might not exist but we still need to clean DB
  if (storageError && !storageError.message?.includes('not found')) {
    console.warn(`Storage delete warning: ${storageError.message}`)
  }

  // Step 3: Delete from database
  const { error: deleteError, count } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    throw new Error(`Failed to delete attachment record: ${deleteError.message}`)
  }

  if (count === 0) {
    throw new Error('Attachment record not deleted - may have been deleted already')
  }

  // Revalidate paths
  revalidatePath('/board')
  revalidatePath(`/calendar`)
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
