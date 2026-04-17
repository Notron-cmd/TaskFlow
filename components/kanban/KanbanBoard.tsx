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
    <div className="flex gap-6 overflow-x-auto pb-6 h-full [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
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
  )
}
