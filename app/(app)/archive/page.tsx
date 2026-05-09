'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, RotateCcw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { restoreTask, permanentlyDeleteTask } from '@/lib/actions/tasks'
import { restoreNote, permanentlyDeleteNote } from '@/lib/actions/notes'

interface ArchivedTask {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  archived_at?: string
}

interface ArchivedNote {
  id: string
  title: string
  content: string
  archived_at?: string
}

export default function ArchivePage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks')
  const [archivedTasks, setArchivedTasks] = useState<ArchivedTask[]>([])
  const [archivedNotes, setArchivedNotes] = useState<ArchivedNote[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadArchivedItems()
  }, [])

  const loadArchivedItems = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (membership) {
        // Load archived tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('workspace_id', membership.workspace_id)
          .eq('is_archived', true)
          .order('archived_at', { ascending: false })

        if (tasks) setArchivedTasks(tasks)
      }

      // Load archived notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false })

      if (notes) setArchivedNotes(notes)
    } catch (error) {
      console.error('Error loading archived items:', error)
      toast({
        title: 'Error',
        description: 'Failed to load archived items',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreTask = async (taskId: string) => {
    try {
      await restoreTask(taskId)
      setArchivedTasks(archivedTasks.filter(t => t.id !== taskId))
      toast({
        title: 'Success',
        description: 'Task restored successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore task',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to permanently delete this task?')) {
      try {
        await permanentlyDeleteTask(taskId)
        setArchivedTasks(archivedTasks.filter(t => t.id !== taskId))
        toast({
          title: 'Success',
          description: 'Task permanently deleted',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete task',
          variant: 'destructive',
        })
      }
    }
  }

  const handleRestoreNote = async (noteId: string) => {
    try {
      await restoreNote(noteId)
      setArchivedNotes(archivedNotes.filter(n => n.id !== noteId))
      toast({
        title: 'Success',
        description: 'Note restored successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore note',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to permanently delete this note?')) {
      try {
        await permanentlyDeleteNote(noteId)
        setArchivedNotes(archivedNotes.filter(n => n.id !== noteId))
        toast({
          title: 'Success',
          description: 'Note permanently deleted',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete note',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="mb-6 animate-slide-in-down">
        <h1 className="font-display text-2xl font-bold text-black dark:text-white mb-2">
          Archive
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          View and manage your archived tasks and notes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'tasks'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Archived Tasks {archivedTasks.length > 0 && `(${archivedTasks.length})`}
          {activeTab === 'tasks' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'notes'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Archived Notes {archivedNotes.length > 0 && `(${archivedNotes.length})`}
          {activeTab === 'notes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500 dark:text-slate-400">Loading...</div>
          </div>
        ) : activeTab === 'tasks' ? (
          <div className="space-y-2">
            {archivedTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">No archived tasks</p>
              </div>
            ) : (
              archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-black dark:text-white truncate">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {task.description}
                      </p>
                    )}
                    {task.archived_at && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Archived {new Date(task.archived_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestoreTask(task.id)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                      title="Permanently delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {archivedNotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">No archived notes</p>
              </div>
            ) : (
              archivedNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-black dark:text-white truncate">
                      {note.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate line-clamp-1">
                      {note.content}
                    </p>
                    {note.archived_at && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Archived {new Date(note.archived_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestoreNote(note.id)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                      title="Permanently delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
