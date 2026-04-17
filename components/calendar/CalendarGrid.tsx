'use client'

import { useState, useCallback } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
    <div className="flex flex-col gap-4 p-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={isNavigating}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-400 transition-colors disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-display text-lg font-bold text-white mx-3 min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={isNavigating}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-400 transition-colors disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={handleToday}
          className="text-xs text-indigo-400 hover:underline cursor-pointer transition-colors"
        >
          Today
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-xs font-mono text-slate-600 uppercase pb-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[1px] bg-white/[0.04] rounded-xl overflow-hidden">
        {days.map((date, idx) => {
          const dayEvents = getEventsForDay(date)
          const isCurrentMonth =
            date.getMonth() === currentMonth
          const isTodayDate = isToday(date)

          return (
            <div
              key={idx}
              className={`bg-[#16162A] p-2 min-h-[100px] hover:bg-[#191930] cursor-pointer transition-colors ${
                !isCurrentMonth ? 'opacity-30' : ''
              }`}
            >
              <div className="text-xs font-mono mb-1">
                {isTodayDate ? (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                    {date.getDate()}
                  </div>
                ) : (
                  <span className={isCurrentMonth ? 'text-slate-400' : 'text-slate-600'}>
                    {date.getDate()}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      if (event.linked_task_id) {
                        openDrawer(event.linked_task_id)
                      }
                    }}
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate mb-0.5 cursor-pointer ${
                      EVENT_TYPE_CONFIG[event.type as keyof typeof EVENT_TYPE_CONFIG]
                        ?.classes || ''
                    }`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
