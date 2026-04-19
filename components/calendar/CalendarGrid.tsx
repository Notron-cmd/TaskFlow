'use client'

import { useState, useCallback } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { deleteEvent } from '@/lib/actions/events'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

type CalendarGridProps = {
  initialEvents: CalendarEvent[]
  year: number
  month: number
  workspaceId: string
}

const EVENT_TYPE_CONFIG = {
  task_due: {
    classes: 'bg-indigo-500/20 text-indigo-300 border-l-2 border-l-indigo-500',
  },
  reminder: {
    classes: 'bg-violet-500/20 text-violet-300 border-l-2 border-l-violet-500',
  },
  meeting: {
    classes: 'bg-teal-500/20 text-teal-300 border-l-2 border-l-teal-500',
  },
  milestone: {
    classes: 'bg-amber-500/20 text-amber-300 border-l-2 border-l-amber-500',
  },
}

export function CalendarGrid({
  initialEvents,
  year: initialYear,
  month: initialMonth,
  workspaceId,
}: CalendarGridProps) {
  const { openDrawer } = useTaskStore()
  const [currentYear, setCurrentYear] = useState(initialYear)
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [isNavigating, setIsNavigating] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)

  const supabase = createClient()

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysCount = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days: Date[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i)
      days.unshift(prevDate)
    }
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i))
    }
    while (days.length % 7 !== 0) {
      days.push(new Date(year, month + 1, days.length - 29))
    }
    return days
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.start_at)
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      )
    })
  }

  const handleDeleteEvent = useCallback(
    async (eventId: string, eventTitle: string) => {
      try {
        await deleteEvent(eventId)
        setEvents(events.filter((e) => e.id !== eventId))
        setDeletingEventId(null)
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    },
    [events]
  )

  const handlePrevMonth = useCallback(async () => {
    setIsNavigating(true)
    let newMonth = currentMonth - 1
    let newYear = currentYear

    if (newMonth < 0) {
      newMonth = 11
      newYear -= 1
    }

    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('start_at', new Date(newYear, newMonth, 1).toISOString())
      .lt('start_at', new Date(newYear, newMonth + 1, 1).toISOString())

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    setEvents(data || [])
    setIsNavigating(false)
  }, [currentMonth, currentYear, workspaceId, supabase])

  const handleNextMonth = useCallback(async () => {
    setIsNavigating(true)
    let newMonth = currentMonth + 1
    let newYear = currentYear

    if (newMonth > 11) {
      newMonth = 0
      newYear += 1
    }

    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('start_at', new Date(newYear, newMonth, 1).toISOString())
      .lt('start_at', new Date(newYear, newMonth + 1, 1).toISOString())

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    setEvents(data || [])
    setIsNavigating(false)
  }, [currentMonth, currentYear, workspaceId, supabase])

  const handleToday = useCallback(async () => {
    const now = new Date()
    setIsNavigating(true)

    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('start_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
      .lt('start_at', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString())

    setCurrentMonth(now.getMonth())
    setCurrentYear(now.getFullYear())
    setEvents(data || [])
    setIsNavigating(false)
  }, [workspaceId, supabase])

  const days = getDaysInMonth(currentYear, currentMonth)
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
  const today = new Date()
  const isToday = (date: Date) =>
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={isNavigating}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-400 transition-smooth disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-display text-base md:text-lg font-bold text-black dark:text-white mx-3 min-w-fit text-center md:min-w-[120px]">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={isNavigating}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-400 transition-smooth disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={handleToday}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer transition-smooth"
        >
          Today
        </button>
      </div>

      {/* Desktop Grid View */}
      <div className="block">
        <div className="grid grid-cols-7 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-xs font-mono text-slate-600 dark:text-slate-600 uppercase pb-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 bg-indigo-300/40 dark:bg-white/[0.03] rounded-xl overflow-hidden">
          {days.map((date, idx) => {
            const dayEvents = getEventsForDay(date)
            const isCurrentMonth = date.getMonth() === currentMonth
            const isTodayDate = isToday(date)

            return (
              <div
                key={idx}
                className={`bg-gray-200 dark:bg-[#16162A] p-2 md:p-3 min-h-[80px] md:min-h-[100px] hover:bg-gray-300 dark:hover:bg-[#191930] cursor-pointer transition-smooth border border-gray-300/50 dark:border-white/[0.03] ${
                  !isCurrentMonth ? 'opacity-30' : ''
                }`}
                style={{
                  animation: `fadeIn 0.4s ease-out ${(idx % 7) * 30}ms both`,
                }}
              >
                <div className="text-xs font-mono mb-1">
                  {isTodayDate ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                      {date.getDate()}
                    </div>
                  ) : (
                    <span className={isCurrentMonth ? 'text-black dark:text-slate-400 text-xs' : 'text-gray-400 dark:text-slate-600 text-xs'}>
                      {date.getDate()}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 hidden md:block">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="group relative"
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    >
                      {deletingEventId === event.id ? (
                        <div className="bg-rose-500/20 border border-rose-500/30 rounded px-1.5 py-1 text-[10px]">
                          <p className="text-rose-200 mb-1">Delete this event?</p>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteEvent(event.id, event.title)
                              }}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] py-0.5 rounded"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingEventId(null)
                              }}
                              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-[9px] py-0.5 rounded"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            if (event.linked_task_id) {
                              openDrawer(event.linked_task_id)
                            }
                          }}
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate mb-0.5 cursor-pointer flex items-center justify-between group ${
                            EVENT_TYPE_CONFIG[event.type as keyof typeof EVENT_TYPE_CONFIG]
                              ?.classes || ''
                          }`}
                        >
                          <span className="truncate">{event.title}</span>
                          {hoveredEventId === event.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingEventId(event.id)
                              }}
                              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete event"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>

                {/* Mobile: Show dot indicator for events */}
                <div className="md:hidden flex gap-1 flex-wrap mt-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          event.type === 'task_due'
                            ? '#818cf8'
                            : event.type === 'reminder'
                              ? '#a78bfa'
                              : event.type === 'meeting'
                                ? '#2dd4bf'
                                : '#fbbf24',
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[7px] text-slate-500">+{dayEvents.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
