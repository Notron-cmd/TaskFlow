'use client'

import { useEffect, useState } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useThemeColor } from '@/hooks/useThemeColor'
import { createClient } from '@/lib/supabase/client'
import {
  updateTask,
  setTaskDueDate,
  deleteTask,
} from '@/lib/actions/tasks'
import {
  addReminder,
  deleteReminder,
} from '@/lib/actions/reminders'
import { getTaskAttachments, getTaskComments } from '@/lib/actions/task-details'
import { formatUtcForDatetimeLocal } from '@/lib/utils/datetime'
import {
  X,
  Calendar,
  Tag,
  User2,
  Trash2,
  Bell,
  Paperclip,
  MessageSquare,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  Loader2,
  Check,
  Kanban,
} from 'lucide-react'
import { AttachmentsList } from '@/components/shared/AttachmentsList'
import { CommentsList } from '@/components/shared/CommentsList'
import { toast } from '@/hooks/use-toast'

type DrawerTask = {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  tags: string[]
  calendar_event_id: string | null
  attachment_count: number
  comment_count: number
  task_assignees?: {
    profiles: {
      id: string
      full_name: string | null
      avatar_url: string | null
    } | null
  }[]
}

const PRIORITY_CONFIG = {
  urgent: { bg: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-500/30', label: 'Urgent' },
  high: { bg: 'bg-orange-100 dark:bg-orange-500/15', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-500/30', label: 'High' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30', label: 'Medium' },
  low: { bg: 'bg-slate-100 dark:bg-slate-500/15', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-500/30', label: 'Low' },
}

const STATUS_CONFIG = {
  todo: { bg: 'bg-slate-100 dark:bg-slate-700/60', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-600/40', label: 'To Do' },
  in_progress: { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30', label: 'In Progress' },
  done: { bg: 'bg-teal-100 dark:bg-teal-500/15', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-500/30', label: 'Done' },
}

export function TaskDrawer() {
  const { activeTaskId, isDrawerOpen, closeDrawer } = useTaskStore()
  const { primary, focus } = useThemeColor()
  const [task, setTask] = useState<DrawerTask | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  const [reminders, setReminders] = useState<Array<{ time: string; channel: string }>>([])
  const [reminderTime, setReminderTime] = useState('5')
  const [reminderChannel, setReminderChannel] = useState('in_app')
  const [attachments, setAttachments] = useState<Array<any>>([])
  const [comments, setComments] = useState<Array<any>>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setPanelVisible(isDrawerOpen)
  }, [isDrawerOpen])

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [supabase])

  useEffect(() => {
    if (!activeTaskId || !isDrawerOpen) {
      setTask(null)
      return
    }

    setIsLoading(true)
    const fetchTask = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_assignees(profiles(id, full_name, avatar_url))')
        .eq('id', activeTaskId)
        .single()

      if (!error && data) {
        setTask(data as DrawerTask)
        setTitle(data.title)
        setDescription(data.description || '')
        setHasChanges(false)
      }
      setIsLoading(false)
    }

    fetchTask()
  }, [activeTaskId, isDrawerOpen, supabase])

  useEffect(() => {
    if (!activeTaskId || !isDrawerOpen) {
      setAttachments([])
      setComments([])
      return
    }

    const fetchDetails = async () => {
      try {
        setIsLoadingDetails(true)
        const [attachmentsData, commentsData] = await Promise.all([
          getTaskAttachments(activeTaskId),
          getTaskComments(activeTaskId),
        ])
        setAttachments(attachmentsData)
        setComments(commentsData)
      } catch (error) {
        console.error('Error fetching task details:', error)
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchDetails()
  }, [activeTaskId, isDrawerOpen])

  const handleStatusChange = async () => {
    if (!task) return
    const statuses: Array<'todo' | 'in_progress' | 'done'> = ['todo', 'in_progress', 'done']
    const currentIndex = statuses.indexOf(task.status)
    const newStatus = statuses[(currentIndex + 1) % statuses.length]

    const updatedTask = { ...task, status: newStatus }
    setTask(updatedTask)
    await updateTask(task.id, { status: newStatus })
  }

  const handlePriorityChange = async () => {
    if (!task) return
    const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['low', 'medium', 'high', 'urgent']
    const currentIndex = priorities.indexOf(task.priority)
    const newPriority = priorities[(currentIndex + 1) % priorities.length]

    const updatedTask = { ...task, priority: newPriority }
    setTask(updatedTask)
    await updateTask(task.id, { priority: newPriority })
  }

  const handleSave = async () => {
    if (!task) return
    setIsSaving(true)
    await updateTask(task.id, { title, description })
    setIsSaving(false)
    setHasChanges(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const handleDelete = async () => {
    if (!task) return
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id)
      closeDrawer()
    }
  }

  const handleAddReminder = async () => {
    if (!task) return
    const newReminder = { time: reminderTime, channel: reminderChannel }
    setReminders([...reminders, newReminder])
    await addReminder(task.id, parseInt(reminderTime), reminderChannel as 'in_app' | 'email' | 'push')
    setReminderTime('5')
    setReminderChannel('in_app')
  }

  const handleDeleteReminder = async (index: number) => {
    if (!task) return
    const updatedReminders = reminders.filter((_, i) => i !== index)
    setReminders(updatedReminders)
  }

  const handleRefreshAttachments = async () => {
    if (!activeTaskId) return
    try {
      const attachmentsData = await getTaskAttachments(activeTaskId)
      setAttachments(attachmentsData)
    } catch (error) {
      console.error('Error refreshing attachments:', error)
    }
  }

  const handleRefreshComments = async () => {
    if (!activeTaskId) return
    try {
      const commentsData = await getTaskComments(activeTaskId)
      setComments(commentsData)
    } catch (error) {
      console.error('Error refreshing comments:', error)
    }
  }

  if (!isDrawerOpen) return null

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${panelVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      />

      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[480px] z-50 bg-white dark:bg-[#16162A] border-l border-gray-200 dark:border-white/[0.06] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] overflow-y-auto transition-smooth-lg ${
          panelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-slate-500" size={24} />
          </div>
        ) : task ? (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStatusChange}
                  className={`rounded-full px-3 py-1 text-xs font-mono border cursor-pointer transition-colors ${STATUS_CONFIG[task.status].bg} ${STATUS_CONFIG[task.status].text} ${STATUS_CONFIG[task.status].border} hover:opacity-80`}
                >
                  {STATUS_CONFIG[task.status].label}
                  <ChevronDown size={12} className="inline ml-1" />
                </button>

                <button
                  onClick={handlePriorityChange}
                  className={`rounded-full px-3 py-1 text-xs font-mono border cursor-pointer transition-colors ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].text} ${PRIORITY_CONFIG[task.priority].border} hover:opacity-80`}
                >
                  {PRIORITY_CONFIG[task.priority].label}
                  <ChevronDown size={12} className="inline ml-1" />
                </button>
              </div>

              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setHasChanges(true)
              }}
              className="w-full bg-transparent font-display text-xl font-bold text-black dark:text-white border-b border-transparent hover:border-gray-300 dark:hover:border-white/[0.08] outline-none pb-2 mb-4 transition-colors"
              placeholder="Task title"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
              }}
            />

            {/* Metadata */}
            <div className="flex items-center gap-4 mb-4 text-xs text-slate-600 dark:text-slate-500 flex-wrap">
              <div className="flex items-center gap-1">
                <User2 size={14} />
                <span>{task.task_assignees?.length || 0} assignee(s)</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays size={14} />
                <span>
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString()
                    : 'No due date'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Tag size={14} />
                <span>{task.tags.length} tag(s)</span>
              </div>
            </div>

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setHasChanges(true)
              }}
              placeholder="Add a description..."
              className="w-full bg-gray-100 dark:bg-[#1E1E35]/50 border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-white/[0.06] rounded-xl p-4 text-sm text-black dark:text-slate-400 placeholder:text-slate-500 dark:placeholder:text-slate-600 outline-none resize-none min-h-[100px] transition-colors mb-6"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${focus}30`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.boxShadow = ''
              }}
            />

            {/* Calendar Link */}
            <div className="bg-gray-100 dark:bg-[#1E1E35] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock size={16} style={{ color: primary }} />
                <span className="font-display text-sm font-semibold text-black dark:text-white/80">
                  Calendar & Due Date
                </span>
              </div>

              <label className="text-xs text-slate-600 dark:text-slate-500 mb-1 block">Due date</label>
              <input
                type="datetime-local"
                value={formatUtcForDatetimeLocal(task.due_date)}
                onChange={(e) => {
                  if (e.target.value) {
                    setTaskDueDate(task.id, new Date(e.target.value))
                  }
                }}
                className="w-full bg-white dark:bg-[#252540] border border-gray-200 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm text-black dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primary
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${focus}30`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              />

              {task.calendar_event_id && (
                <div className="mt-3 text-xs text-amber-600 dark:text-amber-400/70 flex items-center gap-1">
                  <CalendarDays size={12} className="text-amber-600 dark:text-amber-400" />
                  Linked to calendar event
                </div>
              )}
            </div>

            {/* Reminders */}
            <div className="bg-gray-100 dark:bg-[#1E1E35] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={16} className="text-violet-600 dark:text-violet-400" />
                <span className="font-display text-sm font-semibold text-black dark:text-white/80">
                  Reminders
                </span>
              </div>

              <div className="flex gap-2">
                <select 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-white dark:bg-[#252540] border border-gray-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-black dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]"
                >
                  <option value="5">5 min before</option>
                  <option value="15">15 min before</option>
                  <option value="30">30 min before</option>
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>

                <select 
                  value={reminderChannel}
                  onChange={(e) => setReminderChannel(e.target.value)}
                  className="bg-white dark:bg-[#252540] border border-gray-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-black dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]"
                >
                  <option value="in_app">In-app</option>
                  <option value="email">Email</option>
                  <option value="push">Push</option>
                </select>

                <button 
                  onClick={handleAddReminder}
                  className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors font-medium"
                >
                  Add
                </button>
              </div>

              {reminders.length > 0 && (
                <div className="mt-3 space-y-2">
                  {reminders.map((reminder, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white dark:bg-[#16162A] border border-gray-200 dark:border-white/[0.06] rounded-lg p-2"
                    >
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {reminder.time}m • {reminder.channel}
                      </span>
                      <button
                        onClick={() => handleDeleteReminder(idx)}
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/[0.15] rounded p-1 transition-colors"
                        title="Delete reminder"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip size={16} className="text-slate-600 dark:text-slate-500" />
                <span className="font-display text-sm font-semibold text-black dark:text-white/80">
                  Attachments ({attachments.length})
                </span>
              </div>

              {isLoadingDetails ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 size={16} className="animate-spin text-slate-500" />
                </div>
              ) : (
                <AttachmentsList 
                  taskId={task?.id || ''}
                  attachments={attachments}
                  onAttachmentDeleted={handleRefreshAttachments}
                />
              )}
            </div>

            {/* Comments */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-slate-600 dark:text-slate-500" />
                <span className="font-display text-sm font-semibold text-black dark:text-white/80">
                  Comments ({comments.length})
                </span>
              </div>

              {isLoadingDetails ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 size={16} className="animate-spin text-slate-500" />
                </div>
              ) : (
                <CommentsList
                  taskId={task?.id || ''}
                  comments={comments}
                  currentUserId={currentUserId}
                  onCommentAdded={handleRefreshComments}
                  onCommentDeleted={handleRefreshComments}
                />
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="sticky bottom-0 bg-white dark:bg-[#16162A] border-t border-gray-200 dark:border-white/[0.05] px-0 py-4 -mx-6 px-6 mt-6 flex items-center justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400/60 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/[0.08] rounded-lg px-3 py-2 transition-all"
              >
                <Trash2 size={14} />
                Delete task
              </button>

              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="text-white text-xs font-medium rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
                  style={{ backgroundColor: primary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  {isSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : showSaved ? (
                    <>
                      <Check size={12} />
                      Saved!
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
