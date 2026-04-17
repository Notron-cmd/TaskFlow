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
} from 'lucide-react'

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

export function UpcomingPanel({ events }: UpcomingPanelProps) {
  const { openDrawer } = useTaskStore()

  const getEventIcon = (type: string) => {
    return EVENT_ICON_MAP[type] || EVENT_ICON_MAP.task_due
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
                  className={`border-b border-white/[0.04] last:border-0 py-3 first:pt-0 cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 transition-colors ${
                    idx === 0 ? '' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
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
                      <div
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono capitalize w-fit ${
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
                    </div>
                  </div>
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
