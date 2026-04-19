'use client'

import { useEffect, useState } from 'react'
import { getUserReminders, deleteReminder } from '@/lib/actions/reminders'
import { Clock, Trash2, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ReminderWithEvent {
  id: string
  user_id: string
  event_id: string
  minutes_before: number
  channel: 'in_app' | 'email' | 'push'
  scheduled_at: string
  sent: boolean | null
  created_at: string
  calendar_events?: {
    id: string
    title: string
    description: string | null
    start_at: string
    end_at: string
    linked_task_id: string | null
  } | null
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadReminders()
  }, [])

  async function loadReminders() {
    try {
      setLoading(true)
      const data = await getUserReminders()
      setReminders(data as ReminderWithEvent[])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reminders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    try {
      setDeleting(reminderId)
      await deleteReminder(reminderId)
      setReminders(reminders.filter((r) => r.id !== reminderId))
      toast({
        title: 'Success',
        description: 'Reminder deleted',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete reminder',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-500/10 text-blue-400'
      case 'push':
        return 'bg-purple-500/10 text-purple-400'
      case 'in_app':
        return 'bg-indigo-500/10 text-indigo-400'
      default:
        return 'bg-slate-500/10 text-slate-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">
          <div className="h-8 w-8 rounded-full bg-slate-700"></div>
        </div>
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            No Reminders
          </h1>
          <p className="text-slate-500 text-sm max-w-xs">
            You haven't set any reminders yet. Create a task with a due date to add reminders.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="animate-slide-in-down">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Reminders
        </h1>
        <p className="text-slate-400 text-sm">
          {reminders.length} reminder{reminders.length !== 1 ? 's' : ''} set
        </p>
      </div>

      <div className="grid gap-4">
        {reminders.map((reminder, idx) => (
          <div
            key={reminder.id}
            className="bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg p-4 hover:border-gray-400 dark:hover:border-slate-600 transition-smooth"
            style={{
              animation: `slideInUp 0.4s ease-out ${idx * 50}ms both`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-black dark:text-white truncate">
                    {reminder.calendar_events?.title || 'Unnamed Event'}
                  </h3>
                  {reminder.sent && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                      Sent
                    </span>
                  )}
                </div>

                {reminder.calendar_events?.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {reminder.calendar_events.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Remind {reminder.minutes_before} min before
                      <br />
                      ({formatTime(reminder.scheduled_at)})
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChannelColor(reminder.channel)}`}>
                    {reminder.channel === 'in_app' ? 'In App' : reminder.channel.charAt(0).toUpperCase() + reminder.channel.slice(1)}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Event: {formatTime(reminder.calendar_events?.start_at || '')}
                </div>
              </div>

              <button
                onClick={() => handleDeleteReminder(reminder.id)}
                disabled={deleting === reminder.id}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                title="Delete reminder"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
