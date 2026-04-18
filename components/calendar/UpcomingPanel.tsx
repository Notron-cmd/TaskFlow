'use client'

import { useTaskStore } from '@/stores/taskStore'
import { Database } from '@/types/database.types'
import {
  CalendarDays,
  Bell,
  Plus,
  Kanban,
  Clock,
  MapPin,
  Users,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { deleteEvent } from '@/lib/actions/events'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'] & {
  tasks?: { id: string; status: string; priority: string } | null
}

type UpcomingPanelProps = {
  events: CalendarEvent[]
}

const EVENT_ICON_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
  task_due: { icon: <CalendarDays size={16} />, color: 'text-indigo-400' },
  reminder: { icon: <Bell size={16} />, color: 'text-violet-400' },
  meeting: { icon: <Users size={16} />, color: 'text-teal-400' },
  milestone: { icon: <MapPin size={16} />, color: 'text-amber-400' },
}

export function UpcomingPanel({ events: initialEvents }: UpcomingPanelProps) {
  const { openDrawer } = useTaskStore()
  const [events, setEvents] = useState(initialEvents)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  const getEventIcon = (type: string) => {
    return EVENT_ICON_MAP[type] || EVENT_ICON_MAP.task_due
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      setEvents(events.filter((e) => e.id !== eventId))
      setDeletingEventId(null)
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()

    const isTomorrow =
      d.getFullYear() === tomorrow.getFullYear() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getDate() === tomorrow.getDate()

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    if (isToday) {
      return <span className="text-indigo-400">Today · {timeStr}</span>
    }
    if (isTomorrow) {
      return <span>Tomorrow · {timeStr}</span>
    }

    return `${monthNames[d.getMonth()]} ${d.getDate()} · ${timeStr}`
  }

  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
      <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-display font-medium text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors">
        <Plus size={16} />
        New Event
      </button>

      <div className="bg-[#16162A] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={16} className="text-teal-400" />
          <span className="font-display text-sm font-semibold text-white/80">
            Upcoming
          </span>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CalendarDays size={32} className="text-slate-700 mb-2" />
            <p className="text-sm text-slate-600">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-0">
            {events.map((event, idx) => {
              const iconData = getEventIcon(event.type)
              return (
                <div
                  key={event.id}
                  className={`border-b border-white/[0.04] last:border-0 py-3 first:pt-0 transition-smooth group ${
                    idx === 0 ? '' : ''
                  }`}
                  style={{
                    animation: `slideInDown 0.4s ease-out ${idx * 75}ms both`,
                  }}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                >
                  {deletingEventId === event.id ? (
                    <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg p-2 space-y-2">
                      <p className="text-xs text-rose-200">Delete "{event.title}"?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs py-1 rounded"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeletingEventId(null)}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 px-1 cursor-pointer hover:bg-white/[0.02] rounded-lg p-1 -mx-1">
                      <div className={`flex-shrink-0 ${iconData.color}`}>
                        {iconData.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/80 font-medium leading-snug mb-0.5 flex items-center gap-1">
                          <span className="truncate">{event.title}</span>
                          {event.linked_task_id && (
                            <Kanban
                              size={12}
                              className="text-amber-400/70 flex-shrink-0 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDrawer(event.linked_task_id!)
                              }}
                            />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mb-1">
                          {formatDate(event.start_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`rounded-full px-2 py-0.5 text-[10px] font-mono capitalize ${
                              event.type === 'task_due'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : event.type === 'reminder'
                                  ? 'bg-violet-500/20 text-violet-300'
                                  : event.type === 'meeting'
                                    ? 'bg-teal-500/20 text-teal-300'
                                    : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {event.type.replace('_', ' ')}
                          </div>
                          {hoveredEventId === event.id && (
                            <button
                              onClick={() => setDeletingEventId(event.id)}
                              className="ml-auto text-rose-400 hover:text-rose-300 transition-colors"
                              title="Delete event"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-[#16162A] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-slate-500" />
          <span className="font-display text-sm font-semibold text-white/80">
            This week
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Tasks due</span>
            <span className="text-white font-mono font-medium">
              {events.filter((e) => e.type === 'task_due').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Meetings</span>
            <span className="text-white font-mono font-medium">
              {events.filter((e) => e.type === 'meeting').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Reminders</span>
            <span className="text-white font-mono font-medium">
              {events.filter((e) => e.type === 'reminder').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
