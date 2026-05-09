'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Loader2, AlertCircle, Trash2, GripVertical } from 'lucide-react'
import {
  createKanbanColumn,
  updateKanbanColumn,
  deleteKanbanColumn,
  reorderKanbanColumns,
} from '@/lib/actions/kanban-columns'
import { toast } from '@/hooks/use-toast'
import { useThemeColor } from '@/hooks/useThemeColor'

interface KanbanColumn {
  id: string
  name: string
  color: string
  icon: string
  status: string
  position: number
  wip_limit: number | null
}

interface ColumnManagementModalProps {
  workspaceId: string
  columns: KanbanColumn[]
  isOpen?: boolean
  onClose?: () => void
  onColumnsUpdated?: (columns: KanbanColumn[]) => void
}

const ICON_OPTIONS = [
  { value: 'circle', label: '○' },
  { value: 'loader2', label: '◉' },
  { value: 'check-circle2', label: '✓' },
  { value: 'flag', label: '⚑' },
  { value: 'zap', label: '⚡' },
  { value: 'star', label: '★' },
  { value: 'heart', label: '♥' },
  { value: 'target', label: '◎' },
]

const COLOR_OPTIONS = [
  { value: '#94A3B8', label: 'Slate' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#10B981', label: 'Green' },
]

export function ColumnManagementModal({
  workspaceId,
  columns,
  isOpen = false,
  onClose = () => {},
  onColumnsUpdated = () => {},
}: ColumnManagementModalProps) {
  const { primary } = useThemeColor()
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>(columns)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editWipLimit, setEditWipLimit] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => {
    setLocalColumns(columns)
  }, [columns])

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      setError('Column name is required')
      return
    }

    setIsLoading(true)
    try {
      const newColumn = await createKanbanColumn(workspaceId, {
        name: newColumnName,
        color: '#94A3B8',
        icon: 'circle',
      })
      setLocalColumns([...localColumns, newColumn])
      setNewColumnName('')
      toast({
        title: 'Success',
        description: 'Column created successfully',
      })
      onColumnsUpdated([...localColumns, newColumn])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create column')
    } finally {
      setIsLoading(false)
    }
  }

  const startEdit = (column: KanbanColumn) => {
    setEditingId(column.id)
    setEditName(column.name)
    setEditColor(column.color)
    setEditIcon(column.icon)
    setEditWipLimit(column.wip_limit?.toString() || '')
  }

  const saveEdit = async () => {
    if (!editName.trim()) {
      setError('Column name is required')
      return
    }

    setIsLoading(true)
    try {
      const updated = await updateKanbanColumn(editingId!, {
        name: editName,
        color: editColor,
        icon: editIcon,
        wip_limit: editWipLimit ? parseInt(editWipLimit) : null,
      })

      const newColumns = localColumns.map((col) =>
        col.id === editingId ? updated : col
      )
      setLocalColumns(newColumns)
      setEditingId(null)
      toast({
        title: 'Success',
        description: 'Column updated successfully',
      })
      onColumnsUpdated(newColumns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update column')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column?')) return

    setIsLoading(true)
    try {
      await deleteKanbanColumn(columnId)
      const newColumns = localColumns.filter((col) => col.id !== columnId)
      setLocalColumns(newColumns)
      toast({
        title: 'Success',
        description: 'Column deleted successfully',
      })
      onColumnsUpdated(newColumns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete column')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (columnId: string) => {
    setDraggedId(columnId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const draggedIndex = localColumns.findIndex((col) => col.id === draggedId)
    const targetIndex = localColumns.findIndex((col) => col.id === targetId)

    const newColumns = [...localColumns]
    const [movedColumn] = newColumns.splice(draggedIndex, 1)
    newColumns.splice(targetIndex, 0, movedColumn)

    // Update positions
    const reordered = newColumns.map((col, idx) => ({
      ...col,
      position: idx,
    }))
    setLocalColumns(reordered)

    // Save to server
    try {
      await reorderKanbanColumns(
        workspaceId,
        reordered.map((col) => ({ id: col.id, position: col.position }))
      )
      toast({
        title: 'Success',
        description: 'Columns reordered successfully',
      })
      onColumnsUpdated(reordered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder columns')
      setLocalColumns(columns)
    }

    setDraggedId(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#16162A] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/[0.06] sticky top-0 bg-white dark:bg-[#16162A]">
          <h2 className="text-lg font-semibold text-black dark:text-white">Manage Kanban Columns</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-smooth disabled:opacity-50"
          >
            <X size={20} className="text-gray-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-slide-in-down">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Add New Column */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black dark:text-white">Add New Column</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name..."
                disabled={isLoading}
                className="flex-1 bg-gray-100 dark:bg-[#1E1E35] border border-gray-300 dark:border-white/[0.08] hover:border-gray-400 dark:hover:border-white/[0.15] rounded-lg px-4 py-2 text-sm text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-600 outline-none transition-all disabled:opacity-50"
              />
              <button
                onClick={handleAddColumn}
                disabled={isLoading || !newColumnName.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2 transition-smooth disabled:opacity-50"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Columns List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black dark:text-white">Existing Columns</h3>
            <div className="space-y-2">
              {localColumns.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400 py-4">No columns yet</p>
              ) : (
                localColumns.map((column) => (
                  <div
                    key={column.id}
                    draggable
                    onDragStart={() => handleDragStart(column.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(column.id)}
                    className={`p-4 rounded-lg border transition-all cursor-move ${
                      draggedId === column.id
                        ? 'opacity-50 bg-gray-100 dark:bg-white/[0.05] border-gray-400 dark:border-white/[0.15]'
                        : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12]'
                    }`}
                  >
                    {editingId === column.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                            Column Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-white dark:bg-[#1E1E35] border border-gray-300 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm text-black dark:text-white outline-none transition-all disabled:opacity-50"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                              Color
                            </label>
                            <select
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              disabled={isLoading}
                              className="w-full bg-white dark:bg-[#1E1E35] border border-gray-300 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm text-black dark:text-white outline-none transition-all disabled:opacity-50"
                            >
                              {COLOR_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                              Icon
                            </label>
                            <select
                              value={editIcon}
                              onChange={(e) => setEditIcon(e.target.value)}
                              disabled={isLoading}
                              className="w-full bg-white dark:bg-[#1E1E35] border border-gray-300 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm text-black dark:text-white outline-none transition-all disabled:opacity-50"
                            >
                              {ICON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                            WIP Limit (optional)
                          </label>
                          <input
                            type="number"
                            value={editWipLimit}
                            onChange={(e) => setEditWipLimit(e.target.value)}
                            placeholder="Leave empty for no limit"
                            disabled={isLoading}
                            min="1"
                            className="w-full bg-white dark:bg-[#1E1E35] border border-gray-300 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm text-black dark:text-white outline-none transition-all disabled:opacity-50"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-smooth disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 font-medium text-xs hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-smooth disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <GripVertical size={18} className="text-gray-400 dark:text-slate-600 flex-shrink-0" />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: column.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-black dark:text-white truncate">
                              {column.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              Status: {column.status}
                              {column.wip_limit && ` • WIP: ${column.wip_limit}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <button
                            onClick={() => startEdit(column)}
                            disabled={isLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-smooth disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            disabled={isLoading || localColumns.length <= 1}
                            className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete column"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-smooth disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
