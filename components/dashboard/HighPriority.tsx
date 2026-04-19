'use client'

import { useTaskStore } from '@/stores/taskStore'
import { Database } from '@/types/database.types'
import { Flame } from 'lucide-react'

type Task = Database['public']['Tables']['tasks']['Row']

interface HighPriorityProps {
  tasks: Task[]
}

const statusConfig = {
  todo: { label: 'To Do', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  done: { label: 'Done', bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' },
}

export function HighPriority({ tasks }: HighPriorityProps) {
  const { openDrawer } = useTaskStore()
  
  const highPriorityTasks = tasks
    .filter(t => t.priority === 'high' && t.status !== 'done')
    .slice(0, 5)

  return (
    <div
      className="bg-gray-200 dark:bg-slate-800/50 border border-gray-300 dark:border-white/[0.06] rounded-xl p-5 md:p-6 animate-slide-in-right"
      style={{
        animation: 'slideInRight 0.5s ease-out 100ms both',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-black dark:text-white">
          High Priority
        </h2>
        <div className="bg-rose-500/20 rounded-full p-2">
          <Flame className="w-4 h-4 text-rose-500" />
        </div>
      </div>

      <div className="space-y-2">
        {highPriorityTasks.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-slate-500 py-4 text-center">No high priority tasks</p>
        ) : (
          highPriorityTasks.map((task, idx) => (
            <div
              key={task.id}
              onClick={() => openDrawer(task.id)}
              className="p-3 rounded-lg bg-rose-500/5 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 cursor-pointer transition-smooth group"
              style={{
                animation: `slideInDown 0.3s ease-out ${idx * 50}ms both`,
              }}
            >
              <p className="text-xs font-medium text-black dark:text-white line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                {task.title}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${statusConfig[task.status as keyof typeof statusConfig].bg} ${statusConfig[task.status as keyof typeof statusConfig].text}`}>
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
