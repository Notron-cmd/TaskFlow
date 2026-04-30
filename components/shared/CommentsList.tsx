'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { createComment, deleteComment } from '@/lib/actions/task-details'
import { toast } from '@/hooks/use-toast'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  author: { full_name: string | null; avatar_url: string | null } | null
}

interface CommentsProps {
  taskId: string
  comments: Comment[]
  currentUserId: string
  onCommentAdded?: () => void
  onCommentDeleted?: () => void
}

export function CommentsList({
  taskId,
  comments,
  currentUserId,
  onCommentAdded,
  onCommentDeleted,
}: CommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setIsSubmitting(true)
      await createComment(taskId, newComment)
      setNewComment('')
      toast({
        title: 'Success',
        description: 'Comment added',
      })
      onCommentAdded?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      setDeleting(commentId)
      await deleteComment(commentId)
      toast({
        title: 'Success',
        description: 'Comment deleted',
      })
      onCommentDeleted?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete comment',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => {
            const isOwner = comment.user_id === currentUserId
            const date = new Date(comment.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={comment.id}
                className="bg-white dark:bg-[#252540] border border-gray-200 dark:border-white/[0.08] rounded-lg p-3 group"
              >
                <div className="flex items-start gap-2">
                  {comment.author?.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                      {comment.author?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-black dark:text-white">
                        {comment.author?.full_name || 'Unknown'}
                      </p>
                      {isOwner && (
                        <button
                          disabled={deleting === comment.id}
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all disabled:opacity-50"
                          title="Delete comment"
                        >
                          {deleting === comment.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {date}
                    </p>
                    <p className="text-xs text-black dark:text-slate-300 mt-1.5">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-white dark:bg-[#252540] border border-gray-200 dark:border-white/[0.08] rounded-lg px-3 py-2 text-xs text-black dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-600 outline-none focus:border-indigo-500/40 dark:focus:border-indigo-500/40 resize-none min-h-[60px]"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg px-3 py-2 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-fit mt-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Posting...
            </>
          ) : (
            'Post'
          )}
        </button>
      </form>
    </div>
  )
}
