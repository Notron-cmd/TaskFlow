'use client'

import { useState, useRef } from 'react'
import { FileIcon, Trash2, Download, Loader2, Upload } from 'lucide-react'
import { deleteAttachment } from '@/lib/actions/attachments'
import { toast } from '@/hooks/use-toast'

interface Attachment {
  id: string
  task_id: string
  file_name: string
  file_size: number
  created_at: string
}

interface AttachmentsProps {
  taskId: string
  attachments: Attachment[]
  onAttachmentDeleted?: () => void
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function AttachmentsList({ taskId, attachments, onAttachmentDeleted }: AttachmentsProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDelete = async (attachmentId: string) => {
    try {
      setDeleting(attachmentId)
      await deleteAttachment(attachmentId)
      toast({
        title: 'Success',
        description: 'Attachment deleted',
      })
      onAttachmentDeleted?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete attachment',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      // Validate file size
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB')
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const fileDataArray = Array.from(uint8Array)

      const { uploadAttachment } = await import('@/lib/actions/attachments')
      await uploadAttachment(taskId, file.name, file.type, fileDataArray)
      
      toast({
        title: 'Success',
        description: 'Attachment uploaded successfully',
      })
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      onAttachmentDeleted?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload attachment',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Attachments List */}
      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between bg-white dark:bg-[#252540] border border-gray-200 dark:border-white/[0.08] rounded-lg p-3 group hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileIcon size={16} className="text-indigo-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-black dark:text-white truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
              </div>

              <button
                disabled={deleting === attachment.id}
                onClick={() => handleDelete(attachment.id)}
                className="ml-2 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 flex-shrink-0 opacity-0 group-hover:opacity-100"
                title="Delete attachment"
              >
                {deleting === attachment.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          accept="*/*"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 dark:border-white/[0.08] rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin text-indigo-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <div className="text-center">
                <p className="text-xs font-semibold text-black dark:text-white">Click to upload</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">or drag and drop (Max 5MB)</p>
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
