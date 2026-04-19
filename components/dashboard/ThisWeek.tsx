'use client'

import { useTaskStore } from '@/stores/taskStore'
import { Database } from '@/types/database.types'
import { CalendarDays } from 'lucide-react'

type Task = Database['public']['Tables']['tasks']['Row']

interface ThisWeekProps {
  tasks: Task[]
}

const statusConfig = {
  todo: { label: 'To Do', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  done: { label: 'Done', bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' },
}

export function ThisWeek({ tasks }: ThisWeekProps) {
  const { openDrawer } = useTaskStore()
  
  const getWeekTasks = () => {
    const today = new Date()
    const endOfWeek = new Date(today)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    return tasks.filter(task => {
      if (!task.due_date || task.status === 'done') return false
      const dueDate = new Date(task.due_date)
      return dueDate >= today && dueDate <= endOfWeek && dueDate.toDateString() !== today.toDateString()
    }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
  }

  const weekTasks = getWeekTasks()

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="bg-gray-200 dark:bg-slate-800/50 border border-gray-300 dark:border-white/[0.06] rounded-xl p-5 md:p-6 animate-slide-in-left"
      style={{
        animation: 'slideInLeft 0.5s ease-out 300ms both',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-black dark:text-white">
          This Week
        </h2>
        <CalendarDays className="w-4 h-4 text-indigo-400" />
      </div>

      <div className="space-y-2">
        {weekTasks.length === 0 ? (
          <div className="py-6 text-center">
            <CalendarDays className="w-8 h-8 text-slate-400 dark:text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-slate-600 dark:text-slate-500">No tasks due this week</p>
          </div>
        ) : (
          weekTasks.map((task, idx) => (
            <div
              key={task.id}
              onClick={() => openDrawer(task.id)}
              className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] cursor-pointer transition-smooth group"
              style={{
                animation: `slideInUp 0.3s ease-out ${idx * 50}ms both`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black dark:text-white truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Due {formatDate(task.due_date!)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded capitalize whitespace-nowrap ml-2 ${statusConfig[task.status as keyof typeof statusConfig].bg} ${statusConfig[task.status as keyof typeof statusConfig].text}`}>
                  {statusConfig[task.status as keyof typeof statusConfig].label}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
