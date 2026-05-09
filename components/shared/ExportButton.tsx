'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { ExportMenu } from './ExportMenu'

interface ExportButtonProps {
  taskIds?: string[]
  selectedCount?: number
  className?: string
  variant?: 'icon' | 'button'
}

export function ExportButton({
  taskIds,
  selectedCount = 0,
  className = '',
  variant = 'button',
}: ExportButtonProps) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setIsExportMenuOpen(true)}
          className={`p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors ${className}`}
          title={selectedCount > 0 ? `Export ${selectedCount} task(s)` : 'Export all tasks'}
        >
          <Download size={18} />
        </button>
        <ExportMenu
          taskIds={taskIds}
          isOpen={isExportMenuOpen}
          onClose={() => setIsExportMenuOpen(false)}
          selectedCount={selectedCount}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsExportMenuOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#16162A] border border-gray-200 dark:border-white/[0.1] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors font-medium text-sm text-black dark:text-white ${className}`}
      >
        <Download size={16} />
        Export {selectedCount > 0 ? `(${selectedCount})` : ''}
      </button>
      <ExportMenu
        taskIds={taskIds}
        isOpen={isExportMenuOpen}
        onClose={() => setIsExportMenuOpen(false)}
        selectedCount={selectedCount}
      />
    </>
  )
}
