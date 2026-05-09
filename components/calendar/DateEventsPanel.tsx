'use client'

import { Database } from '@/types/database.types'
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { deleteEvent } from '@/lib/actions/events'
import { useTaskStore } from '@/stores/taskStore'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

interface DateEventsPanelProps {
  selectedDate: Date | null
  events: CalendarEvent[]
  onEventDeleted: (eventId: string) => void
}

const EVENT_TYPE_CONFIG = {
  task_due: {
    label: 'Task Due',
    icon: <CheckCircle size={16} />,
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
  },
  reminder: {
    label: 'Reminder',
    icon: <AlertCircle size={16} />,
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400',
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-300',
  },
  meeting: {
    label: 'Meeting',
    icon: <Users size={16} />,
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    textColor: 'text-teal-400',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
  },
  milestone: {
    label: 'Milestone',
    icon: <MapPin size={16} />,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
  },
}

export function DateEventsPanel({
  selectedDate,
  events,
  onEventDeleted,
}: DateEventsPanelProps) {
  const { openDrawer } = useTaskStore()
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)

  if (!selectedDate) {
    return (
      <div className="bg-gray-100 dark:bg-[#16162A] border border-gray-300 dark:border-white/[0.06] rounded-xl p-6 mt-4">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays size={32} className="text-gray-400 dark:text-slate-700 mb-2" />
          <p className="text-sm text-gray-600 dark:text-slate-600">
            Select a date to view events
          </p>
        </div>
      </div>
    )
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.start_at)
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      )
    })
  }

  const dateEvents = getEventsForDate(selectedDate)
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const formatDate = (date: Date) => {
    const today = new Date()
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    return {
      dayName: dayNames[date.getDay()],
      isToday,
      formatted: `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      onEventDeleted(eventId)
      setDeletingEventId(null)
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const dateInfo = formatDate(selectedDate)
  const config = EVENT_TYPE_CONFIG

  return (
    <div className="bg-gray-100 dark:bg-[#16162A] border border-gray-300 dark:border-white/[0.06] rounded-xl p-6 mt-4 animate-fade-in">
      {/* Date Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              dateInfo.isToday ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-white/[0.05]'
            }`}
          >
            <span
              className={`text-sm font-bold ${
                dateInfo.isToday
                  ? 'text-white'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              {selectedDate.getDate()}
            </span>
          </div>
          <div>
            <h3 className="font-display font-semibold text-black dark:text-white">
              {dateInfo.formatted}
            </h3>
            {dateInfo.isToday && (
              <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                Today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Events List */}
      {dateEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays size={24} className="text-gray-400 dark:text-slate-700 mb-2" />
          <p className="text-sm text-gray-600 dark:text-slate-600">
            No events on this date
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dateEvents.map((event, idx) => {
            const eventConfig = config[event.type as keyof typeof EVENT_TYPE_CONFIG]
            return (
              <div
                key={event.id}
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                style={{
                  animation: `slideInDown 0.3s ease-out ${idx * 50}ms both`,
                }}
              >
                {deletingEventId === event.id ? (
                  <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-rose-200 font-medium">
                      Delete "{event.title}"?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingEventId(null)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`${eventConfig?.bgColor || 'bg-gray-500/10'} border ${
                      eventConfig?.borderColor || 'border-gray-500/30'
                    } rounded-lg p-4 transition-all hover:border-opacity-100 cursor-pointer group`}
                    onClick={() => {
                      if (event.linked_task_id) {
                        openDrawer(event.linked_task_id)
                      }
                    }}
                  >
                    {/* Event Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`${eventConfig?.textColor || 'text-gray-400'} mt-1`}
                        >
                          {eventConfig?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-black dark:text-white truncate">
                            {event.title}
                          </h4>
                          {eventConfig && (
                            <span
                              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${
                                eventConfig.badgeBg
                              } ${eventConfig.badgeText}`}
                            >
                              {eventConfig.label}
                            </span>
                          )}
                        </div>
                      </div>
                      {hoveredEventId === event.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingEventId(event.id)
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors flex-shrink-0"
                          title="Delete event"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2">
                      {/* Time */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                        <Clock size={14} />
                        <span>{formatTime(event.start_at)}</span>
                        {event.end_at && (
                          <>
                            <span>-</span>
                            <span>{formatTime(event.end_at)}</span>
                          </>
                        )}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                          <MapPin size={14} />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Event Count */}
      {dateEvents.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/[0.05]">
          <p className="text-xs text-gray-600 dark:text-slate-500 text-center">
            {dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''} on this date
          </p>
        </div>
      )}
    </div>
  )
}
