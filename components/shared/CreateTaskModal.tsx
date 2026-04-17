'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'high', label: 'High', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  { value: 'urgent', label: 'Urgent', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
]

export function CreateTaskModal() {
  const { isCreateModalOpen, closeCreateModal, upsertTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchWorkspaceId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: membership } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (membership) {
          setWorkspaceId(membership.workspace_id)
        }
      } catch (err) {
        console.error('Failed to fetch workspace:', err)
      }
    }

    if (isCreateModalOpen && !workspaceId) {
      fetchWorkspaceId()
    }
  }, [isCreateModalOpen, workspaceId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!workspaceId) {
      setError('Workspace not found')
      return
    }

    setIsLoading(true)

    try {
      const newTask = await createTask({
        workspace_id: workspaceId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status: 'todo',
        tags: [],
        position: 0,
      })

      upsertTask(newTask)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setError(null)
    closeCreateModal()
  }

  if (!isCreateModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#16162A] border border-white/[0.06] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Create new task</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
              <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Task title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              disabled={isLoading}
              className="w-full bg-[#1E1E35] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              disabled={isLoading}
              rows={3}
              className="w-full bg-[#1E1E35] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Priority Select */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  disabled={isLoading}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    priority === option.value
                      ? `${option.color}`
                      : 'bg-white/[0.02] text-slate-400 border-white/[0.08] hover:bg-white/[0.05]'
                  } disabled:opacity-50`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !workspaceId}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
