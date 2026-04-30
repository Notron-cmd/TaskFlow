'use client'

import { useRouter } from 'next/navigation'
import { useSearchStore, SearchResult } from '@/stores/searchStore'
import { useTaskStore } from '@/stores/taskStore'
import { Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface SearchResultsProps {
  isRecent?: boolean
}

export function SearchResults({ isRecent = false }: SearchResultsProps) {
  const { results, isOpen, setIsOpen, clearSearch } = useSearchStore()
  const { openDrawer } = useTaskStore()
  const router = useRouter()

  if (!isOpen || results.length === 0) return null

  const handleTaskClick = (taskId: string) => {
    openDrawer(taskId)
    clearSearch()
  }

  const handleEventClick = (eventId: string) => {
    router.push(`/calendar?event=${eventId}`)
    clearSearch()
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-rose-500'
      case 'high':
        return 'text-orange-500'
      case 'medium':
        return 'text-amber-500'
      default:
        return 'text-slate-400'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 size={14} className="text-teal-500" />
      case 'in_progress':
        return <Clock size={14} className="text-amber-500" />
      default:
        return <AlertCircle size={14} className="text-slate-500" />
    }
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#16162A] border border-gray-200 dark:border-white/[0.08] rounded-lg shadow-lg max-h-96 overflow-y-auto z-50" data-search-results>
      <div className="p-2">
        {isRecent && (
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Recent
          </div>
        )}
        {results.map((result) => (
          <button
            key={`${result.type}-${result.id}`}
            onClick={() => {
              if (result.type === 'task') {
                handleTaskClick(result.id)
              } else {
                handleEventClick(result.id)
              }
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E1E35] transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {result.type === 'task' ? (
                  getStatusIcon(result.status)
                ) : (
                  <Calendar size={14} className="text-indigo-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-black dark:text-white truncate">
                    {result.title}
                  </p>
                  {result.type === 'task' && result.priority && (
                    <span className={`text-xs font-semibold ${getPriorityColor(result.priority)}`}>
                      {result.priority}
                    </span>
                  )}
                </div>

                {result.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {result.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#252540] text-gray-700 dark:text-slate-300">
                    {result.type === 'task' ? 'Task' : 'Event'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
