'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Database } from '@/types/database.types'
import TaskCard from '@/components/kanban/TaskCard'
import TaskCardSkeleton from '@/components/kanban/TaskCardSkeleton'
import { Circle, Plus, Inbox, Loader2 } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'

type Task = Database['public']['Tables']['tasks']['Row']

type KanbanColumnProps = {
  id: string
  title: string
  tasks: Task[]
  isLoading?: boolean
  columnColor?: string
  wipLimit?: number
}

export function KanbanColumn({
  id,
  title,
  tasks,
  isLoading = false,
  columnColor = '#94A3B8',
  wipLimit = undefined,
}: KanbanColumnProps) {
  const { openCreateModalWithStatus } = useTaskStore()
  const { setNodeRef, isOver } = useDroppable({ id })
  const taskCount = tasks.length

  return (
    <div ref={setNodeRef} className="w-full md:w-80 md:flex-shrink-0 flex flex-col px-2 md:px-0" style={{
      animation: 'slideInUp 0.5s ease-out'
    }}>
      <div
        className="h-[2px] rounded-full mb-2 md:mb-3 w-full opacity-60 transition-smooth"
        style={{ background: columnColor }}
      />

      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: columnColor }}
          />
          {id === 'in_progress' ? (
            <Loader2 className="size-3 md:size-3.5 text-amber-400 animate-spin" />
          ) : (
            <Circle className="size-3 md:size-3.5 text-slate-400" />
          )}
          <span className="font-display text-xs md:text-sm font-semibold text-white/80">
            {title}
          </span>
          <div className="bg-white/[0.06] rounded-full px-1.5 md:px-2 text-[10px] md:text-xs text-slate-500 font-mono">
            {taskCount}
          </div>
        </div>

        {wipLimit && taskCount >= wipLimit - 1 && (
          <div
            className={`text-[10px] md:text-xs font-mono ${
              taskCount >= wipLimit ? 'text-rose-400' : 'text-amber-400'
            }`}
          >
            {taskCount}/{wipLimit}
          </div>
        )}
      </div>

      <div
        className={`flex-1 rounded-xl md:rounded-2xl p-2 md:p-3 min-h-[300px] md:min-h-[500px] space-y-2 md:space-y-3 transition-all duration-150 ${
          isOver
            ? 'bg-indigo-500/[0.04] border-2 border-dashed border-indigo-500/40'
            : 'bg-black/20'
        }`}
      >
        {isLoading ? (
          <>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </>
        ) : taskCount === 0 ? (
          <div className="py-6 md:py-12 flex flex-col items-center gap-1 md:gap-2">
            <Inbox className="size-6 md:size-8 text-slate-700" />
            <p className="text-xs md:text-sm text-slate-600">No tasks yet</p>
            <p
              className="text-[11px] md:text-xs text-indigo-400/70 cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={() => openCreateModalWithStatus(id)}
            >
              Add your first task
            </p>
          </div>
        ) : (
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                style={{
                  animation: `slideInUp 0.5s ease-out ${idx * 50}ms both`,
                }}
              >
                <TaskCard task={task} isDragging={false} />
              </div>
            ))}
          </SortableContext>
        )}
      </div>

      <button
        onClick={() => openCreateModalWithStatus(id)}
        className="mt-2 w-full rounded-xl py-2 border border-dashed border-white/[0.06] text-slate-600 hover:text-slate-400 hover:border-white/[0.12] flex items-center justify-center gap-2 text-xs transition-all duration-150"
      >
        <Plus size={12} />
        Add task
      </button>
    </div>
  )
}
