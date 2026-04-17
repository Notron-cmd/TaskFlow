'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Database } from '@/types/database.types'
import TaskCard from '@/components/kanban/TaskCard'
import TaskCardSkeleton from '@/components/kanban/TaskCardSkeleton'
import { Circle, Loader2, CheckCircle2, Plus, Inbox } from 'lucide-react'

type Task = Database['public']['Tables']['tasks']['Row']

type KanbanColumnProps = {
  id: 'todo' | 'in_progress' | 'done'
  title: string
  tasks: Task[]
  isLoading?: boolean
  onAddTask?: () => void
}

type ColumnConfig = {
  color: string
  icon: typeof Circle
  iconClass: string
  wipLimit?: number
}

const COLUMN_CONFIG: Record<KanbanColumnProps['id'], ColumnConfig> = {
  todo: {
    color: '#94A3B8',
    icon: Circle,
    iconClass: 'text-slate-400',
  },
  in_progress: {
    color: '#F59E0B',
    icon: Loader2,
    iconClass: 'text-amber-400 animate-spin',
    wipLimit: 5,
  },
  done: {
    color: '#14B8A6',
    icon: CheckCircle2,
    iconClass: 'text-teal-400',
  },
}

export function KanbanColumn({
  id,
  title,
  tasks,
  isLoading = false,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const config = COLUMN_CONFIG[id]
  const Icon = config.icon
  const wipLimit = config.wipLimit
  const taskCount = tasks.length

  return (
    <div ref={setNodeRef} className="w-80 flex-shrink-0 flex flex-col">
      <div
        className="h-[2px] rounded-full mb-3 w-full opacity-60"
        style={{ background: config.color }}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: config.color }}
          />
          <Icon className={`size-3.5 ${config.iconClass}`} />
          <span className="font-display text-sm font-semibold text-white/80">
            {title}
          </span>
          <div className="bg-white/[0.06] rounded-full px-2 text-xs text-slate-500 font-mono ml-1">
            {taskCount}
          </div>
        </div>

        {wipLimit && taskCount >= wipLimit - 1 && (
          <div
            className={`text-xs font-mono ${
              taskCount >= wipLimit ? 'text-rose-400' : 'text-amber-400'
            }`}
          >
            {taskCount}/{wipLimit}
          </div>
        )}
      </div>

      <div
        className={`flex-1 rounded-2xl p-3 min-h-[500px] space-y-3 transition-all duration-150 ${
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
          <div className="py-12 flex flex-col items-center gap-2">
            <Inbox className="size-8 text-slate-700" />
            <p className="text-sm text-slate-600">No tasks yet</p>
            <p
              className="text-xs text-indigo-400/70 cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={() => onAddTask?.()}
            >
              Add your first task
            </p>
          </div>
        ) : (
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} isDragging={false} />
            ))}
          </SortableContext>
        )}
      </div>

      <button
        onClick={() => onAddTask?.()}
        className="mt-2 w-full rounded-xl py-2 border border-dashed border-white/[0.06] text-slate-600 hover:text-slate-400 hover:border-white/[0.12] flex items-center justify-center gap-2 text-xs transition-all duration-150"
      >
        <Plus size={12} />
        Add task
      </button>
    </div>
  )
}
