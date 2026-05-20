'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, ChevronDown } from 'lucide-react'
import { useSubtaskStore, type Subtask } from '@/stores/subtaskStore'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  getSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  toggleSubtaskComplete,
  reorderSubtasks,
} from '@/lib/actions/subtasks-and-timers'
import { toast } from '@/hooks/use-toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SubtaskManagerProps {
  taskId: string
  compact?: boolean
}

interface SubtaskItemProps {
  subtask: Subtask
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (subtask: Subtask) => void
}

function SubtaskItem({ subtask, onToggle, onDelete, onEdit }: SubtaskItemProps) {
  const { primary } = useThemeColor()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subtask.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all group"
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
        <ChevronDown size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(subtask.id)}
        style={{
          backgroundColor: subtask.completed ? primary : 'transparent',
          borderColor: primary,
        }}
        className="flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center hover:scale-110"
      >
        {subtask.completed && <Check size={14} className="text-white" />}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate transition-all ${
            subtask.completed ? 'text-slate-500 line-through' : 'text-slate-200'
          }`}
        >
          {subtask.title}
        </p>
        {subtask.description && (
          <p className="text-xs text-slate-600 truncate mt-0.5">{subtask.description}</p>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(subtask.id)}
        className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 text-slate-600"
        title="Delete subtask"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export function SubtaskManager({ taskId, compact = false }: SubtaskManagerProps) {
  const { primary } = useThemeColor()
  const [loading, setLoading] = useState(true)
  const [showInput, setShowInput] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [expanded, setExpanded] = useState(!compact)

  const { subtasks, getSubtasksByTaskId, setSubtasks, toggleSubtask } = useSubtaskStore()
  const taskSubtasks = getSubtasksByTaskId(taskId)
  const { completed, total, percentage } = useSubtaskStore().getProgress(taskId)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load subtasks on mount
  useEffect(() => {
    const loadSubtasks = async () => {
      setLoading(true)
      try {
        const data = await getSubtasks(taskId)
        if (data) {
          setSubtasks(
            taskId,
            data.map((s: any) => ({
              id: s.id,
              taskId: s.task_id,
              title: s.title,
              description: s.description,
              completed: s.completed,
              position: s.position,
              createdAt: s.created_at,
              updatedAt: s.updated_at,
            }))
          )
        }
      } catch (error) {
        console.error('Error loading subtasks:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSubtasks()
  }, [taskId, setSubtasks])

  const handleAddSubtask = async () => {
    if (!newTitle.trim()) return

    try {
      setLoading(true)
      const subtask = await createSubtask(taskId, { title: newTitle.trim() })
      if (subtask) {
        useSubtaskStore().addSubtask(taskId, {
          id: subtask.id,
          taskId: subtask.task_id,
          title: subtask.title,
          description: subtask.description,
          completed: subtask.completed,
          position: subtask.position,
          createdAt: subtask.created_at,
          updatedAt: subtask.updated_at,
        })
        setNewTitle('')
        setShowInput(false)
        toast.success('Subtask created')
      }
    } catch (error) {
      console.error('Error adding subtask:', error)
      toast.error('Failed to create subtask')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    try {
      const subtask = taskSubtasks.find((s) => s.id === subtaskId)
      if (!subtask) return

      await toggleSubtaskComplete(subtaskId, !subtask.completed)
      toggleSubtask(taskId, subtaskId)
    } catch (error) {
      console.error('Error toggling subtask:', error)
      toast.error('Failed to update subtask')
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask(subtaskId)
      useSubtaskStore().deleteSubtask(taskId, subtaskId)
      toast.success('Subtask deleted')
    } catch (error) {
      console.error('Error deleting subtask:', error)
      toast.error('Failed to delete subtask')
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = taskSubtasks.findIndex((s) => s.id === active.id)
      const newIndex = taskSubtasks.findIndex((s) => s.id === over.id)

      const newOrder = arrayMove(taskSubtasks, oldIndex, newIndex)
      useSubtaskStore().reorderSubtasks(taskId, newOrder)

      try {
        await reorderSubtasks(
          taskId,
          newOrder.map((s) => s.id)
        )
      } catch (error) {
        console.error('Error reordering subtasks:', error)
      }
    }
  }

  if (compact && total === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">
            Subtasks <span className="text-xs text-slate-500">({completed}/{total})</span>
          </h3>
          {total > 0 && (
            <div className="h-1.5 w-24 rounded-full bg-white/[0.1] overflow-hidden">
              <div
                style={{
                  width: `${percentage}%`,
                  backgroundColor: primary,
                  transition: 'width 0.3s ease',
                }}
                className="h-full rounded-full"
              />
            </div>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
      </div>

      {expanded && (
        <div className="space-y-2">
          {/* Subtasks List */}
          {taskSubtasks.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={taskSubtasks.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {taskSubtasks.map((subtask) => (
                    <SubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={handleToggleSubtask}
                      onDelete={handleDeleteSubtask}
                      onEdit={() => {}}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add New Subtask */}
          {!showInput && (
            <button
              onClick={() => setShowInput(true)}
              style={{ borderColor: primary + '30', color: primary }}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-dashed hover:bg-white/[0.05] transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add subtask
            </button>
          )}

          {/* Input New Subtask */}
          {showInput && (
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask()
                  if (e.key === 'Escape') {
                    setShowInput(false)
                    setNewTitle('')
                  }
                }}
                placeholder="Enter subtask title..."
                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddSubtask}
                  disabled={loading || !newTitle.trim()}
                  style={{ backgroundColor: primary }}
                  className="flex-1 py-1.5 rounded text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowInput(false)
                    setNewTitle('')
                  }}
                  className="flex-1 py-1.5 rounded bg-white/5 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
