'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteEvent } from '@/lib/actions/events'
import { useToast } from '@/hooks/use-toast'

interface DeleteEventButtonProps {
  eventId: string
  eventTitle: string
  onDeleted?: () => void
  variant?: 'small' | 'normal'
}

export function DeleteEventButton({
  eventId,
  eventTitle,
  onDeleted,
  variant = 'normal',
}: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteEvent(eventId)

      toast({
        title: 'Success',
        description: `Event "${eventTitle}" deleted`,
      })

      setShowConfirm(false)
      onDeleted?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 space-y-3">
        <p className="text-sm text-rose-200">
          Delete event <strong>"{eventTitle}"</strong>?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className={`flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors ${
        variant === 'small' ? 'text-xs' : 'text-sm'
      }`}
    >
      <Trash2 size={variant === 'small' ? 14 : 16} />
      Delete
    </button>
  )
}
