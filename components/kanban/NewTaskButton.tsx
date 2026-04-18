'use client'

import { Plus } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'

export function NewTaskButton() {
  const { openCreateModal } = useTaskStore()

  return (
    <button
      onClick={() => openCreateModal()}
      className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-medium rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-smooth"
    >
      <Plus size={12} />
      New Task
    </button>
  )
}
