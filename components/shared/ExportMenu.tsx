'use client'

import { useState } from 'react'
import { Download, FileText, Loader2, X } from 'lucide-react'
import { exportTasksAsCSV, exportTasksAsJSON, generateTasksPrintHTML } from '@/lib/actions/export'
import { toast } from '@/hooks/use-toast'
import { useThemeColor } from '@/hooks/useThemeColor'

interface ExportMenuProps {
  taskIds?: string[]
  isOpen?: boolean
  onClose?: () => void
  selectedCount?: number
}

export function ExportMenu({ 
  taskIds, 
  isOpen = false, 
  onClose = () => {}, 
  selectedCount = 0 
}: ExportMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { primary } = useThemeColor()

  const handleExportCSV = async () => {
    try {
      setIsLoading(true)
      const csvContent = await exportTasksAsCSV(taskIds)
      downloadFile(csvContent, `tasks-export-${Date.now()}.csv`, 'text/csv')
      toast({
        title: '✅ Export Successful',
        description: 'Tasks exported as CSV',
      })
      onClose()
    } catch (error: any) {
      toast({
        title: '❌ Export Failed',
        description: error.message || 'Failed to export tasks',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportJSON = async () => {
    try {
      setIsLoading(true)
      const jsonContent = await exportTasksAsJSON(taskIds)
      downloadFile(jsonContent, `tasks-export-${Date.now()}.json`, 'application/json')
      toast({
        title: '✅ Export Successful',
        description: 'Tasks exported as JSON',
      })
      onClose()
    } catch (error: any) {
      toast({
        title: '❌ Export Failed',
        description: error.message || 'Failed to export tasks',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintPDF = async () => {
    try {
      setIsLoading(true)
      const htmlContent = await generateTasksPrintHTML(taskIds)
      
      // Open print dialog in a new window
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Failed to open print window. Please check your popup settings.')
      }
      
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      toast({
        title: '🖨️ Ready to Print',
        description: 'Print dialog opened. You can save as PDF from print options.',
      })
      onClose()
    } catch (error: any) {
      toast({
        title: '❌ Print Failed',
        description: error.message || 'Failed to open print dialog',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white dark:bg-[#0F0F1A] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-white/[0.1]"
        style={{ borderColor: `${primary}20` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primary}20`, color: primary }}
            >
              <Download size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-black dark:text-white">Export Tasks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedCount > 0 ? `Export ${selectedCount} task(s)` : 'Export all tasks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Export Options */}
        <div className="space-y-3 mb-6">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">📊</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-black dark:text-white">CSV Format</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? 'Exporting...' : 'Spreadsheet compatible'}
              </p>
            </div>
            {isLoading ? (
              <Loader2 size={18} className="animate-spin text-slate-400" />
            ) : (
              <FileText size={18} className="text-slate-400" />
            )}
          </button>

          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 dark:text-green-400 font-semibold">{ }</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-black dark:text-white">JSON Format</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? 'Exporting...' : 'Complete data export'}
              </p>
            </div>
            {isLoading ? (
              <Loader2 size={18} className="animate-spin text-slate-400" />
            ) : (
              <FileText size={18} className="text-slate-400" />
            )}
          </button>

          {/* Print/PDF */}
          <button
            onClick={handlePrintPDF}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 dark:text-red-400 font-semibold">🖨️</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-black dark:text-white">Print / PDF</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? 'Preparing...' : 'Print dialog & save as PDF'}
              </p>
            </div>
            {isLoading ? (
              <Loader2 size={18} className="animate-spin text-slate-400" />
            ) : (
              <FileText size={18} className="text-slate-400" />
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> JSON export includes all task details including comments and attachments metadata.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="w-full mt-4 py-2.5 rounded-lg font-medium text-sm transition-colors border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50"
        >
          Close
        </button>
      </div>
    </div>
  )
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const element = document.createElement('a')
  element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`)
  element.setAttribute('download', filename)
  element.style.display = 'none'
  
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}
