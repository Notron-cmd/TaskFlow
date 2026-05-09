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
import { Settings2 } from 'lucide-react'
import { useTaskStore, type KanbanColumn } from '@/stores/taskStore'
import { KanbanColumn as KanbanColumnComponent } from '@/components/kanban/KanbanColumn'
import { ColumnManagementModal } from '@/components/kanban/ColumnManagementModal'
import TaskCard from '@/components/kanban/TaskCard'
import { moveTask } from '@/lib/actions/tasks'
import { Database } from '@/types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

type KanbanBoardProps = {
  initialTasks: Task[]
  initialColumns: any[]
  workspaceId: string
}

export function KanbanBoard({
  initialTasks,
  initialColumns,
  workspaceId,
}: KanbanBoardProps) {
  const { tasks, columns, setTasks, setColumns, moveTaskOptimistic, openColumnModal, isColumnModalOpen, closeColumnModal } = useTaskStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState<string>(initialColumns[0]?.status || 'todo')

  useEffect(() => {
    setTasks(initialTasks)
    
    // If no columns provided, use default columns as fallback
    if (!initialColumns || initialColumns.length === 0) {
      console.warn('[KanbanBoard] No columns provided, using defaults', { 
        initialColumnsLength: initialColumns?.length 
      })
      const defaultColumns = [
        { id: '1', workspace_id: workspaceId, name: 'To Do', color: '#94A3B8', icon: 'circle', status: 'todo', position: 0, wip_limit: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', workspace_id: workspaceId, name: 'In Progress', color: '#F59E0B', icon: 'loader2', status: 'in_progress', position: 1, wip_limit: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', workspace_id: workspaceId, name: 'Done', color: '#14B8A6', icon: 'check-circle2', status: 'done', position: 2, wip_limit: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]
      setColumns(defaultColumns)
      setActiveTab('todo')
    } else {
      console.log('[KanbanBoard] Loaded columns from database', { 
        count: initialColumns.length,
        columns: initialColumns
      })
      setColumns(initialColumns)
      setActiveTab(initialColumns[0]?.status || 'todo')
    }
  }, [initialTasks, initialColumns, setTasks, setColumns])

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

    let newStatus: string = activeTask.status

    if (columns.some((col) => col.status === over.id)) {
      newStatus = over.id as string
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
  }, [activeTask, tasks, columns, moveTaskOptimistic])

  const handleDragCancel = useCallback(() => {
    setActiveTask(null)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Column Management Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={openColumnModal}
          className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 transition-smooth"
          title="Manage columns"
        >
          <Settings2 size={18} />
        </button>
      </div>

      {/* Tabs - visible on mobile, hidden on md+ */}
      <div className="md:hidden flex gap-1 mb-3 border-b border-gray-200 dark:border-white/[0.05] overflow-x-auto pb-2 sticky top-0 bg-white dark:bg-[#0F0F1A] z-10">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.status)
          return (
            <button
              key={column.id}
              onClick={() => setActiveTab(column.status)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-smooth border-b-2 flex items-center gap-1.5 ${
                activeTab === column.status
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 animate-scale-in'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {column.name}
              <span className="text-[10px] bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Kanban Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop View - Multiple columns */}
        <div className="hidden md:flex gap-4 md:gap-6 w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {columns.map((column) => {
              const columnTasks = tasks
                .filter((t) => t.status === column.status)
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

              return (
                <KanbanColumnComponent
                  key={column.id}
                  id={column.status}
                  title={column.name}
                  tasks={columnTasks}
                  columnColor={column.color}
                  wipLimit={column.wip_limit || undefined}
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
            {columns.map((column) => {
              const columnTasks = tasks
                .filter((t) => t.status === column.status)
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

              return (
                <div
                  key={column.id}
                  className={`w-full flex-shrink-0 flex flex-col overflow-y-auto pb-4 transition-opacity duration-300 ${
                    column.status === activeTab ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
                  }`}
                >
                  <KanbanColumnComponent
                    id={column.status}
                    title={column.name}
                    tasks={columnTasks}
                    columnColor={column.color}
                    wipLimit={column.wip_limit || undefined}
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

      {/* Column Management Modal */}
      <ColumnManagementModal
        workspaceId={workspaceId}
        columns={columns}
        isOpen={isColumnModalOpen}
        onClose={closeColumnModal}
        onColumnsUpdated={setColumns}
      />
    </div>
  )
}
