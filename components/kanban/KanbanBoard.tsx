'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useTaskStore } from '@/stores/taskStore'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import TaskCard from '@/components/kanban/TaskCard'
import { moveTask } from '@/lib/actions/tasks'
import { Database } from '@/types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

type KanbanBoardProps = {
  initialTasks: Task[]
  workspaceId: string
}

const COLUMNS: Array<{
  id: 'todo' | 'in_progress' | 'done'
  title: string
}> = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

export function KanbanBoard({
  initialTasks,
  workspaceId,
}: KanbanBoardProps) {
  const { tasks, setTasks, moveTaskOptimistic } = useTaskStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState<'todo' | 'in_progress' | 'done'>('todo')

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks, setTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }, [tasks])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    if (!activeTask) {
      setActiveTask(null)
      return
    }

    let newStatus: 'todo' | 'in_progress' | 'done' = activeTask.status

    if (COLUMNS.some((col) => col.id === over.id)) {
      newStatus = over.id as 'todo' | 'in_progress' | 'done'
    } else {
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) {
        newStatus = overTask.status
      }
    }

    if (newStatus !== activeTask.status || active.id !== over.id) {
      const tasksInNewColumn = tasks
        .filter((t) => t.status === newStatus)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

      const overIndex = tasksInNewColumn.findIndex(
        (t) => t.id === over.id
      )
      const newPosition = overIndex >= 0 ? overIndex : tasksInNewColumn.length

      moveTaskOptimistic(activeTask.id, newStatus, newPosition)
      moveTask(activeTask.id, newStatus, newPosition)
    }

    setActiveTask(null)
  }, [activeTask, tasks, moveTaskOptimistic])

  const handleDragCancel = useCallback(() => {
    setActiveTask(null)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Tabs - visible on mobile, hidden on md+ */}
      <div className="md:hidden flex gap-1 mb-3 border-b border-gray-200 dark:border-white/[0.05] overflow-x-auto pb-2 sticky top-0 bg-white dark:bg-[#0F0F1A] z-10">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id)
          return (
            <button
              key={column.id}
              onClick={() => setActiveTab(column.id)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-smooth border-b-2 flex items-center gap-1.5 ${
                activeTab === column.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 animate-scale-in'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {column.title}
              <span className="text-[10px] bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Kanban Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop View - 3 columns */}
        <div className="hidden md:flex gap-4 md:gap-6 w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {COLUMNS.map((column) => {
              const columnTasks = tasks
                .filter((t) => t.status === column.id)
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={columnTasks}
                  onAddTask={() => {}}
                />
              )
            })}

            <DragOverlay>
              {activeTask ? (
                <div className="drop-shadow-2xl">
                  <TaskCard task={activeTask} isDragging={true} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Mobile View - Full width single column with smooth transition */}
        <div className="md:hidden flex-1 overflow-hidden flex items-stretch">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {COLUMNS.map((column) => {
              const columnTasks = tasks
                .filter((t) => t.status === column.id)
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

              return (
                <div
                  key={column.id}
                  className={`w-full flex-shrink-0 flex flex-col overflow-y-auto pb-4 transition-opacity duration-300 ${
                    column.id === activeTab ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
                  }`}
                >
                  <KanbanColumn
                    id={column.id}
                    title={column.title}
                    tasks={columnTasks}
                    onAddTask={() => {}}
                  />
                </div>
              )
            })}

            <DragOverlay>
              {activeTask ? (
                <div className="drop-shadow-2xl">
                  <TaskCard task={activeTask} isDragging={true} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
