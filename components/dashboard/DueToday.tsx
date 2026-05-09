'use client'

import { useTaskStore } from '@/stores/taskStore'
import { Database } from '@/types/database.types'
import { Calendar, AlertCircle } from 'lucide-react'

type Task = Database['public']['Tables']['tasks']['Row']

interface DueTodayProps {
  tasks: Task[]
}

const statusConfig = {
  todo: { label: 'To Do', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  done: { label: 'Done', bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' },
}

export function DueToday({ tasks }: DueTodayProps) {
  const { openDrawer } = useTaskStore()
  const today = new Date().toDateString()
  
  const dueTodayTasks = tasks.filter(task => {
    if (!task.due_date || task.status === 'done') return false
    return new Date(task.due_date).toDateString() === today
  })

  return (
    <div
      className="bg-gray-200 dark:bg-slate-800/50 border border-gray-300 dark:border-white/[0.06] rounded-xl p-5 md:p-6"
      style={{
        willChange: 'contents',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-black dark:text-white">
          Due Today
        </h2>
        <AlertCircle className="w-4 h-4 text-rose-500" />
      </div>

      <div className="space-y-2">
        {dueTodayTasks.length === 0 ? (
          <div className="py-6 text-center">
            <Calendar className="w-8 h-8 text-gray-400 dark:text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-600 dark:text-slate-500">No tasks due today</p>
          </div>
        ) : (
          dueTodayTasks.map((task, idx) => (
            <div
              key={task.id}
              onClick={() => openDrawer(task.id)}
              className="p-3 rounded-lg bg-rose-500/5 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 cursor-pointer transition-smooth group"
            >
              <p className="text-sm font-medium text-black dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-smooth">
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${statusConfig[task.status as keyof typeof statusConfig].bg} ${statusConfig[task.status as keyof typeof statusConfig].text}`}>
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
