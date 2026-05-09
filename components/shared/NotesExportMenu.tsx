'use client'

import { useState } from 'react'
import { Download, FileText, Loader2, X, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  generateNotesPrintHTML,
  exportNotesAsMarkdown,
  exportNotesAsJSON,
  exportNotesAsCSV,
} from '@/lib/actions/notes-export'
import { toast } from '@/hooks/use-toast'
import { useThemeColor } from '@/hooks/useThemeColor'
import type { Note } from '@/stores/notesStore'

interface NotesExportMenuProps {
  notes: Note[]
  isOpen?: boolean
  onClose?: () => void
}

type ExportStep = 'select' | 'format'

export function NotesExportMenu({ notes, isOpen = false, onClose = () => {} }: NotesExportMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [exportStep, setExportStep] = useState<ExportStep>('select')
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set(notes.map((n) => n.id)))
  const { primary } = useThemeColor()

  const selectedNotesCount = selectedNoteIds.size
  const notesToExport = notes.filter((n) => selectedNoteIds.has(n.id))

  const handleExportPDF = async () => {
    try {
      setIsLoading(true)
      const htmlContent = await generateNotesPrintHTML(notesToExport)

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
        title: '❌ Export Failed',
        description: error.message || 'Failed to export as PDF',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportMarkdown = async () => {
    try {
      setIsLoading(true)
      const markdownContent = await exportNotesAsMarkdown(notesToExport)
      downloadFile(markdownContent, `notes-export-${Date.now()}.md`, 'text/markdown')
      toast({
        title: '✅ Export Successful',
        description: 'Notes exported as Markdown',
      })
      onClose()
    } catch (error: any) {
      toast({
        title: '❌ Export Failed',
        description: error.message || 'Failed to export as Markdown',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportJSON = async () => {
    try {
      setIsLoading(true)
      const jsonContent = await exportNotesAsJSON(notesToExport)
      downloadFile(jsonContent, `notes-export-${Date.now()}.json`, 'application/json')
      toast({
        title: '✅ Export Successful',
        description: 'Notes exported as JSON',
      })
      onClose()
    } catch (error: any) {
      toast({
        title: '❌ Export Failed',
        description: error.message || 'Failed to export as JSON',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      setIsLoading(true)
      const csvContent = await exportNotesAsCSV(notesToExport)
      downloadFile(csvContent, `notes-export-${Date.now()}.csv`, 'text/csv')
      toast({
        title: '✅ Export Successful',
        description: 'Notes exported as CSV',
      })
      onClose()
    } catch (error: any) {
      toast({
        title: '❌ Export Failed',
        description: error.message || 'Failed to export as CSV',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleNoteSelection = (noteId: string) => {
    const newSelected = new Set(selectedNoteIds)
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId)
    } else {
      newSelected.add(noteId)
    }
    setSelectedNoteIds(newSelected)
  }

  const selectAll = () => {
    setSelectedNoteIds(new Set(notes.map((n) => n.id)))
  }

  const deselectAll = () => {
    setSelectedNoteIds(new Set())
  }

  if (!isOpen) {
    return null
  }

  if (exportStep === 'select') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div
          className="bg-white dark:bg-[#0F0F1A] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-white/[0.1] flex flex-col max-h-[80vh]"
          style={{ borderColor: `${primary}20` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primary}20`, color: primary }}
              >
                <Download size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-black dark:text-white">Select Notes</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedNotesCount} of {notes.length} selected
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose()
                setExportStep('select')
                setSelectedNoteIds(new Set(notes.map((n) => n.id)))
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          </div>

          {/* Select All / Deselect All */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAll}
              disabled={selectedNotesCount === notes.length || isLoading}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/[0.1] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              disabled={selectedNotesCount === 0 || isLoading}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/[0.1] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
            >
              Deselect All
            </button>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2">
            {notes.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                <p className="text-sm">No notes available</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => toggleNoteSelection(note.id)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/[0.1] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedNoteIds.has(note.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleNoteSelection(note.id)
                    }}
                    className="mt-0.5 w-4 h-4 rounded accent-color cursor-pointer"
                    style={{
                      accentColor: primary,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-black dark:text-white truncate">
                      {note.title || 'Untitled Note'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate line-clamp-2">
                      {note.content || 'No content'}
                    </p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="text-xs px-2 py-0.5 text-slate-500 dark:text-slate-400">
                            +{note.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose()
                setExportStep('select')
                setSelectedNoteIds(new Set(notes.map((n) => n.id)))
              }}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setExportStep('format')}
              disabled={selectedNotesCount === 0 || isLoading}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors text-white disabled:opacity-50"
              style={{
                backgroundColor: primary,
              }}
            >
              Continue ({selectedNotesCount})
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Format selection step
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
              <h2 className="font-semibold text-black dark:text-white">Export Notes</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedNotesCount} note{selectedNotesCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose()
              setExportStep('select')
              setSelectedNoteIds(new Set(notes.map((n) => n.id)))
            }}
            className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Export Options */}
        <div className="space-y-3 mb-6">
          {/* PDF/Print */}
          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 dark:text-red-400 font-semibold">🖨️</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-black dark:text-white">Print / PDF</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? 'Preparing...' : 'Print & save as PDF'}
              </p>
            </div>
            {isLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <FileText size={18} className="text-slate-400" />}
          </button>

          {/* Markdown */}
          <button
            onClick={handleExportMarkdown}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">#</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-black dark:text-white">Markdown</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? 'Exporting...' : 'For editing & sharing'}
              </p>
            </div>
            {isLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <FileText size={18} className="text-slate-400" />}
          </button>

          {/* JSON */}
          <button
            onClick={handleExportJSON}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 dark:text-green-400 font-semibold">{ }</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-black dark:text-white">JSON</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? 'Exporting...' : 'Complete data export'}
              </p>
            </div>
            {isLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <FileText size={18} className="text-slate-400" />}
          </button>

          {/* CSV */}
          <button
            onClick={handleExportCSV}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">📊</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-black dark:text-white">CSV</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? 'Exporting...' : 'For spreadsheets'}
              </p>
            </div>
            {isLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <FileText size={18} className="text-slate-400" />}
          </button>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setExportStep('select')}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <button
            onClick={() => {
              onClose()
              setExportStep('select')
              setSelectedNoteIds(new Set(notes.map((n) => n.id)))
            }}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const element = document.createElement('a')
  element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`)
  element.setAttribute('download', filename)
  element.style.display = 'none'

  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}
