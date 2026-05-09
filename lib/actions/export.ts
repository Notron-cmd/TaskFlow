'use server'

import { createClient } from '@/lib/supabase/server'

export interface ExportTask {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  tags: string[] | null
  created_at: string
  assignees: string
  comments: number
  attachments: number
}

/**
 * Export tasks as CSV format
 */
export async function exportTasksAsCSV(taskIds?: string[]): Promise<string> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(
      `id,
       title,
       description,
       status,
       priority,
       due_date,
       tags,
       created_at,
       comment_count,
       attachment_count,
       task_assignees (
         profiles (
           full_name
         )
       )`
    )

  if (taskIds && taskIds.length > 0) {
    query = query.in('id', taskIds)
  }

  const { data: tasks, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  // Build CSV header
  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Due Date',
    'Tags',
    'Created At',
    'Assignees',
    'Comments',
    'Attachments',
  ]

  // Build CSV rows
  const rows = tasks.map((task: any) => {
    const assignees =
      task.task_assignees?.map((a: any) => a.profiles?.full_name || 'Unknown').join('; ') || ''
    const tags = task.tags?.join('; ') || ''
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : ''
    const createdAt = new Date(task.created_at).toLocaleString()

    return [
      escapeCSV(task.id),
      escapeCSV(task.title),
      escapeCSV(task.description || ''),
      task.status,
      task.priority,
      dueDate,
      tags,
      createdAt,
      assignees,
      task.comment_count || 0,
      task.attachment_count || 0,
    ]
  })

  // Combine headers and rows
  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

  return csvContent
}

/**
 * Export tasks as JSON format
 */
export async function exportTasksAsJSON(taskIds?: string[]): Promise<string> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(
      `*,
       task_assignees (
         profiles (
           id,
           full_name,
           avatar_url
         )
       ),
       task_comments (
         id,
         content,
         created_at,
         profiles (
           full_name
         )
       )`
    )

  if (taskIds && taskIds.length > 0) {
    query = query.in('id', taskIds)
  }

  const { data: tasks, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return JSON.stringify(tasks, null, 2)
}

/**
 * Helper function to escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (!value) return ''

  // If value contains comma, newline, or quotes, wrap in quotes and escape inner quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"` 
  }

  return value
}

/**
 * Generate PDF content as HTML that can be printed
 */
export async function generateTasksPrintHTML(taskIds?: string[]): Promise<string> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(
      `id,
       title,
       description,
       status,
       priority,
       due_date,
       tags,
       created_at,
       comment_count,
       attachment_count,
       task_assignees (
         profiles (
           full_name
         )
       )`
    )

  if (taskIds && taskIds.length > 0) {
    query = query.in('id', taskIds)
  }

  const { data: tasks, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  const statusColors: Record<string, string> = {
    todo: '#ef4444',
    in_progress: '#f59e0b',
    done: '#10b981',
  }

  const priorityColors: Record<string, string> = {
    low: '#94a3b8',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
  }

  const tasksHTML = tasks
    .map((task: any) => {
      const assignees =
        task.task_assignees
          ?.map((a: any) => a.profiles?.full_name || 'Unknown')
          .join(', ') || 'Unassigned'
      const tags = task.tags?.join(', ') || '-'
      const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'

      return `
    <div style="page-break-inside: avoid; margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">${escapeHTML(task.title)}</h3>
        <span style="background-color: ${statusColors[task.status] || '#gray'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
          ${task.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      
      ${task.description ? `<p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${escapeHTML(task.description)}</p>` : ''}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; margin-bottom: 10px;">
        <div>
          <strong>Priority:</strong>
          <span style="background-color: ${priorityColors[task.priority] || '#gray'}; color: white; padding: 2px 6px; border-radius: 3px; margin-left: 5px;">
            ${task.priority.toUpperCase()}
          </span>
        </div>
        <div><strong>Due Date:</strong> ${dueDate}</div>
        <div><strong>Assignees:</strong> ${assignees}</div>
        <div><strong>Tags:</strong> ${tags}</div>
      </div>
      
      <div style="display: flex; gap: 15px; font-size: 13px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 10px;">
        <span>💬 Comments: ${task.comment_count || 0}</span>
        <span>📎 Attachments: ${task.attachment_count || 0}</span>
      </div>
    </div>
  `
    })
    .join('')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Taskflow - Tasks Export</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f9fafb;
        color: #1f2937;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e5e7eb;
      }
      .header h1 {
        margin: 0 0 10px 0;
        font-size: 28px;
        font-weight: 700;
      }
      .header p {
        margin: 5px 0;
        color: #666;
        font-size: 14px;
      }
      .tasks-container {
        max-width: 900px;
        margin: 0 auto;
      }
      @media print {
        body {
          background-color: white;
          padding: 0;
        }
        .no-print {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>📋 Taskflow Tasks Export</h1>
      <p>Exported on ${new Date().toLocaleString()}</p>
      <p>Total Tasks: ${tasks.length}</p>
    </div>
    
    <div class="tasks-container">
      ${tasksHTML}
    </div>
    
    <script>
      // Auto-print when loaded
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.print();
        }, 500);
      });
    </script>
  </body>
  </html>
  `

  return html
}

function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
