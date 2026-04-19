'use client'

import { PieChart, BarChart3 } from 'lucide-react'

interface TasksAnalyticsProps {
  stats: {
    total: number
    todo: number
    inProgress: number
    done: number
    overdue: number
  }
}

export function TasksAnalytics({ stats }: TasksAnalyticsProps) {
  const completionRate = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100)

  // Calculate percentages for pie chart visualization
  const todoPercent = stats.total === 0 ? 0 : (stats.todo / stats.total) * 100
  const inProgressPercent = stats.total === 0 ? 0 : (stats.inProgress / stats.total) * 100
  const donePercent = stats.total === 0 ? 0 : (stats.done / stats.total) * 100

  return (
    <div
      className="bg-gray-200 dark:bg-slate-800/50 border border-gray-300 dark:border-white/[0.06] rounded-xl p-5 md:p-6 animate-slide-in-right"
      style={{
        animation: 'slideInRight 0.5s ease-out 200ms both',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-base font-semibold text-black dark:text-white">
          Analytics
        </h2>
        <BarChart3 className="w-4 h-4 text-gray-600 dark:text-indigo-400" />
      </div>

      {/* Completion Rate */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
            Completion Rate
          </p>
          <p className="text-sm font-bold text-black dark:text-white">
            {completionRate}%
          </p>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-300 dark:bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Status Distribution */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">
          Status Distribution
        </p>

        {/* To Do */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">
            To Do
          </span>
          <div className="relative w-16 h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-400 rounded-full"
              style={{ width: `${todoPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-6 text-right">
            {stats.todo}
          </span>
        </div>

        {/* In Progress */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">
            In Progress
          </span>
          <div className="relative w-16 h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${inProgressPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-6 text-right">
            {stats.inProgress}
          </span>
        </div>

        {/* Done */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">
            Done
          </span>
          <div className="relative w-16 h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full"
              style={{ width: `${donePercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-6 text-right">
            {stats.done}
          </span>
        </div>
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            ⚠️ {stats.overdue} overdue {stats.overdue === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      )}
    </div>
  )
}
