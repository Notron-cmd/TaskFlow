'use client'

import { Database } from '@/types/database.types'
import { useTaskStore } from '@/stores/taskStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CalendarClock,
  CalendarDays,
  GripVertical,
  Paperclip,
  MessageSquare,
} from 'lucide-react'

type Task = Database['public']['Tables']['tasks']['Row']

type TaskCardProps = {
  task: Task & {
    task_assignees?: {
      profiles: {
        id: string
        full_name: string | null
        avatar_url: string | null
      } | null
    }[]
    calendar_events?: {
      id: string
      start_at: string
      type: string
    } | null
  }
  isDragging?: boolean
}

const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgent',
    classes: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
  high: {
    label: 'High',
    classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  },
  low: {
    label: 'Low',
    classes: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
  },
}

const AVATAR_COLORS = [
  'bg-indigo-500/30 text-indigo-200',
  'bg-teal-500/30 text-teal-200',
  'bg-violet-500/30 text-violet-200',
  'bg-rose-500/30 text-rose-200',
  'bg-amber-500/30 text-amber-200',
]

function getInitials(name: string | null, email?: string): string {
  if (name) {
    const words = name.split(' ')
    const initials = words
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
    return initials
  }
  if (email) {
    return email.charAt(0).toUpperCase()
  }
  return '?'
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = date.getDate()
  return `${month} ${day}`
}

export default function TaskCard({ task, isDragging }: TaskCardProps) {
  const openDrawer = useTaskStore((state) => state.openDrawer)
  
  // Setup sortable for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const containerClass = `group relative bg-[#16162A] border rounded-lg md:rounded-xl p-2.5 md:p-4 cursor-grab active:cursor-grabbing transition-smooth touch-none ${
    isSortableDragging || isDragging
      ? 'border-indigo-500/40 bg-[#191930] shadow-[0_8px_30px_rgba(0,0,0,0.5)] scale-105 rotate-[2deg]'
      : 'border-white/[0.06] hover:border-indigo-500/30 hover:bg-[#191930]'
  }`

  const assignees = task.task_assignees || []
  const visibleAssignees = assignees.slice(0, 3)
  const hiddenCount = Math.max(0, assignees.length - 3)

  const displayTags = task.tags || []
  const visibleTags = displayTags.slice(0, 3)
  const hiddenTagCount = Math.max(0, displayTags.length - 3)

  const dueDate = task.due_date
  const overdue = dueDate ? isOverdue(dueDate) : false

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={containerClass}
      onClick={() => openDrawer(task.id)}
      {...attributes}
      {...listeners}
    >
      {/* Top Row - Calendar Icon & Priority */}
      <div className="flex items-start justify-between mb-1.5 md:mb-2">
        <div>
          {task.calendar_events && (
            <CalendarDays
              size={12}
              className="text-amber-400/70"
              aria-label="Linked to calendar"
            />
          )}
        </div>
        <div
          className={`rounded-full px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] font-mono font-medium uppercase border ${
            PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
              .classes
          }`}
        >
          {
            PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
              .label
          }
        </div>
      </div>

      {/* Title */}
      <div className="font-display text-xs md:text-sm font-semibold text-white/90 mb-1 leading-snug">
        {task.title}
      </div>

      {/* Description */}
      {task.description && (
        <div className="text-[11px] md:text-xs text-slate-500 line-clamp-2 mb-2 md:mb-3">
          {task.description}
        </div>
      )}

      {/* Tags */}
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
          {visibleTags.map((tag, idx) => (
            <div
              key={idx}
              className="bg-white/[0.05] rounded-md px-1.5 md:px-2 py-0.5 text-[8px] md:text-[10px] text-slate-400"
            >
              {tag}
            </div>
          ))}
          {hiddenTagCount > 0 && (
            <div className="bg-white/[0.05] rounded-md px-1.5 md:px-2 py-0.5 text-[8px] md:text-[10px] text-slate-400">
              +{hiddenTagCount}
            </div>
          )}
        </div>
      )}

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center gap-1 mb-2 md:mb-3">
          <CalendarClock
            size={12}
            className={overdue ? 'text-rose-400' : 'text-slate-500'}
          />
          <span
            className={`text-[10px] md:text-xs ${
              overdue ? 'text-rose-400' : 'text-slate-500'
            }`}
          >
            {overdue ? 'Overdue · ' : ''}
            {formatDate(dueDate)}
          </span>
        </div>
      )}

      {/* Footer Row - Assignees & Meta */}
      <div className="flex items-center justify-between mt-1 md:mt-2">
        {/* Assignee Avatars */}
        <div className="flex items-center">
          {visibleAssignees.map((assignee, idx) => {
            const profile = assignee.profiles
            if (!profile) return null
            const initials = getInitials(profile.full_name)
            const colorClass =
              AVATAR_COLORS[idx % AVATAR_COLORS.length]

            return (
              <div
                key={profile.id}
                className={`w-4 md:w-5 h-4 md:h-5 rounded-full flex items-center justify-center text-[7px] md:text-[8px] font-bold ring-2 ring-[#16162A] ${colorClass} ${
                  idx > 0 ? '-ml-1.5' : ''
                }`}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Assignee'}
                    className="w-4 md:w-5 h-4 md:h-5 rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            )
          })}
          {hiddenCount > 0 && (
            <div className="w-4 md:w-5 h-4 md:h-5 rounded-full flex items-center justify-center text-[7px] md:text-[8px] font-bold ring-2 ring-[#16162A] bg-slate-700 text-slate-400 -ml-1.5">
              +{hiddenCount}
            </div>
          )}
        </div>

        {/* Meta Icons */}
        <div className="flex items-center gap-2 md:gap-3">
          {task.attachment_count && task.attachment_count > 0 && (
            <div className="flex items-center gap-0.5">
              <Paperclip size={11} className="text-slate-600" />
              <span className="text-[9px] md:text-xs text-slate-600">
                {task.attachment_count}
              </span>
            </div>
          )}
          {task.comment_count && task.comment_count > 0 && (
            <div className="flex items-center gap-0.5">
              <MessageSquare size={11} className="text-slate-600" />
              <span className="text-[9px] md:text-xs text-slate-600">
                {task.comment_count}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Drag Handle */}
      <div
        className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <GripVertical size={11} className="text-slate-700" />
      </div>
    </div>
  )
}
