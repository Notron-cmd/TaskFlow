'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { createClient } from '@/lib/supabase/client'
import { addReminder } from '@/lib/actions/reminders'
import { X, Loader2, AlertCircle, Calendar } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useThemeColor } from '@/hooks/useThemeColor'
import { ReminderManager, type ReminderConfig } from './ReminderManager'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'high', label: 'High', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  { value: 'urgent', label: 'Urgent', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
]

export function CreateTaskModal() {
  const { isCreateModalOpen, closeCreateModal, upsertTask, createTaskStatus } = useTaskStore()
  const { primary, focus } = useThemeColor()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState<string>('')
  const [reminders, setReminders] = useState<ReminderConfig[]>([])
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
      // Convert due date to ISO format
      // Note: new Date(dueDate) automatically interprets as local time
      // and .toISOString() correctly converts to UTC
      let dueDateISO: string | undefined
      if (dueDate) {
        const date = new Date(dueDate)
        dueDateISO = date.toISOString()
      }

      const newTask = await createTask({
        workspace_id: workspaceId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status: createTaskStatus || 'todo',
        tags: [],
        position: 0,
        due_date: dueDateISO,
      })

      // If reminders are set, add them to the task's calendar event
      if (reminders.length > 0) {
        // If no calendar event was auto-created via trigger, create it manually
        let eventId: string | null = newTask.calendar_event_id ?? null
        
        if (!eventId && dueDateISO) {
          try {
            const endAt = new Date(new Date(dueDateISO).getTime() + 3600000).toISOString()
            const { data: event } = await supabase
              .from('calendar_events')
              .insert({
                title: title.trim(),
                description: description.trim() || undefined,
                start_at: dueDateISO,
                end_at: endAt,
                linked_task_id: newTask.id,
                workspace_id: workspaceId,
                created_by: (await supabase.auth.getUser()).data.user?.id || '',
                type: 'task_due',
              })
              .select()
              .single()
            
            eventId = event?.id ?? null
          } catch (eventErr) {
            console.error('Failed to create calendar event:', eventErr)
          }
        }

        // Add reminders to the calendar event
        if (eventId) {
          try {
            for (const reminder of reminders) {
              await addReminder(eventId, reminder.minutesBefore, reminder.channel)
            }
          } catch (reminderErr) {
            console.error('Failed to add reminders:', reminderErr)
            // Don't fail the whole operation if reminders fail
          }
        }
      }

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
    setDueDate('')
    setReminders([])
    setError(null)
    closeCreateModal()
  }

  if (!isCreateModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#16162A] border border-white/[0.06] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] sticky top-0 bg-[#16162A]">
          <h2 className="text-lg font-semibold text-white">Create new task</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-white/10 rounded-lg transition-smooth disabled:opacity-50"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 animate-slide-in-down">
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
              className="w-full bg-[#1E1E35] border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all disabled:opacity-50"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${focus}30`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }}
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
              className="w-full bg-[#1E1E35] border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all resize-none disabled:opacity-50"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${focus}30`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }}
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

          {/* Due Date Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Due date (optional)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#1E1E35] border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all disabled:opacity-50"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${focus}30`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }}
            />
          </div>

          {/* Reminder Manager */}
          {dueDate && (
            <div className="pt-2 border-t border-white/[0.08]">
              <ReminderManager
                reminders={reminders}
                onAdd={(reminder) => setReminders([...reminders, reminder])}
                onRemove={(index) => setReminders(reminders.filter((_, i) => i !== index))}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
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
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
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
