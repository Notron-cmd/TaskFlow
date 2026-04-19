'use client'

import { useTaskStore } from '@/stores/taskStore'
import { Database } from '@/types/database.types'
import { ChevronRight, Clock } from 'lucide-react'
import { format } from 'date-fns'

type Task = Database['public']['Tables']['tasks']['Row']

interface RecentTasksProps {
  tasks: Task[]
}

const priorityConfig = {
  high: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', label: 'High' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Medium' },
  low: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', label: 'Low' },
}

const statusConfig = {
  todo: { label: 'To Do', color: 'slate' },
  in_progress: { label: 'In Progress', color: 'amber' },
  done: { label: 'Done', color: 'teal' },
}

export function RecentTasks({ tasks }: RecentTasksProps) {
  const { openDrawer } = useTaskStore()
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5)

  return (
    <div
      className="bg-gray-200 dark:bg-slate-800/50 border border-gray-300 dark:border-white/[0.06] rounded-xl p-5 md:p-6 animate-slide-in-left"
      style={{
        animation: 'slideInLeft 0.5s ease-out 100ms both',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-black dark:text-white">
          Recent Tasks
        </h2>
        <Clock className="w-4 h-4 text-gray-500 dark:text-slate-400" />
      </div>

      <div className="space-y-2">
        {recentTasks.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-slate-500 py-4 text-center">No tasks yet</p>
        ) : (
          recentTasks.map((task, idx) => (
            <div
              key={task.id}
              onClick={() => openDrawer(task.id)}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-amber-100 dark:hover:bg-white/[0.04] cursor-pointer transition-smooth group"
              style={{
                animation: `slideInUp 0.3s ease-out ${idx * 50}ms both`,
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black dark:text-white truncate">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${priorityConfig[task.priority as keyof typeof priorityConfig].bg} ${priorityConfig[task.priority as keyof typeof priorityConfig].text}`}>
                    {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {statusConfig[task.status as keyof typeof statusConfig].label}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-smooth" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
